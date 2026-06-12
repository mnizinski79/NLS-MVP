# AI Hotel Search — Foundation + CONCIERGE (Design Spec)

**Date:** 2026-06-12
**Status:** Approved for planning
**Scope:** Shared foundation (two non-negotiable rules, data contract, strategy flag) +
Direction 5 (CONCIERGE) as the default strategy. Directions 1, 2, 3, 4, 6 are deferred to
follow-on specs but everything is built behind one switchable flag so they do not fork the
codebase.

---

## 1. Background

A 20-session usability study surfaced two failures in nearly every session. They are
**non-negotiable table stakes** for every strategy:

1. **No hallucinated amenities.** The assistant may only state amenities/features
   verifiable against real inventory. Unverifiable claims are never made. Misses are shown
   honestly (✗), never hidden.
2. **All-in pricing from the first touch.** The all-in total (room + taxes & fees) is the
   primary number everywhere (chat, map pins, cards, detail). Base rate + fees appear only
   as fine print.

Additionally, every results card must show **bed type** and a **reason/score** (why this
result, against what).

The six directions are implemented as switchable strategies behind one enum:

```
SearchStrategy = RECEIPTS | ALL_IN | COMPARE | SCORECARD | CONCIERGE | TRIP_CANVAS
```

`CONCIERGE` is the default and the only strategy UI built in this spec.

## 2. Key decisions (from brainstorming)

| Decision | Choice |
| --- | --- |
| This spec's scope | Foundation + CONCIERGE only |
| New-field data source | Hand-authored into `hotels.json` for all 6 NYC IHG hotels; "verified" = present in curated data |
| Claim engine | **Structured composition** — Gemini is a planner/router; the app composes ALL factual claims from verified data |
| Clarifier trigger | Only when the request is **genuinely ambiguous** (and the dimension varies across inventory) |
| Intent enum | Reuse existing `IntentType` |
| All-in display | Per-night all-in is primary; becomes a trip total once dates are known |
| Refinement chips | Top 4 visible, rest behind "more"; never a zero-result chip |
| Architecture | Approach A — strategy objects + shared core services + view-models; no per-strategy component forks |

## 3. Architecture (Approach A)

- `SearchStrategyService` reads the `SearchStrategy` flag (default `CONCIERGE`) and exposes
  the active strategy object. Components never branch on the flag.
- A strategy implements a common interface:
  - `planTurn(query, state) → TurnPlan` (calls the planner)
  - `buildView(hotels, plan) → TurnView`
- Rule-bearing logic lives once in shared core services that strategies consume and cannot
  bypass: `PricingService` (all-in), `ClaimService` (verified-claims firewall),
  `MatchService` (scoring, reasons, live inventory counts).
- Components are dumb renderers of view-models (`TurnView` / `HotelResultVM`).

Adding a future strategy = one new strategy class. No `*ngIf="strategy===…"` in components.

## 4. Data contract

### 4.1 Model changes (`hotel.model.ts`, all additive)

```ts
pricing: {
  nightlyRate: number;      // existing (base room, per night)
  roomRate: number;         // existing
  fees: number;             // existing (taxes & fees, per night)
  allInNightly: number;     // NEW, derived: roomRate + fees (authoritative)
};
bedType: string;            // NEW e.g. "1 King", "2 Queen"

verifiedAmenities: { id: string; label: string }[];  // NEW — ONLY claimable set
missingAmenities:  { id: string; label: string }[];   // NEW — honest ✗

neighborhood: {             // NEW (CONCIERGE "why here"; Direction 6 later)
  name: string;
  vibe: string[];           // e.g. ["romantic","quiet"]
  walkScore: number;
  nearby: string[];         // e.g. ["Bryant Park 3 min"]
};
pointsEarned: number;       // NEW (per stay)
walkToDiningMin: number;    // NEW
```

- Legacy `amenities: string[]` remains for back-compat but is **not** a claim source.
  Existing strings are migrated into `verifiedAmenities` during authoring.
- `allInNightly` is derived once in the hotel transform (`roomRate + fees`) — single source
  of truth.
- Per-result `matchReasons` / criteria-scores are computed at request time by `MatchService`
  and live on the runtime `HotelResultVM`, not in `hotels.json`.

### 4.2 Authoring

All six hotels get realistic values: verified amenities migrated from today's list,
plausible misses, bed types, neighborhood vibe/walk-score/nearby, points earned,
walk-to-dining minutes.

## 5. Core shared services

### `PricingService` (extend)
- `allInNightly(hotel)`, `allInTotal(hotel, nights) = allInNightly × nights`.
- `formatAllIn(...)` → the primary number everywhere.
- `formatFinePrint(...)` → `"$X room + $Y taxes & fees"`.
- All-in computed pre-conversion, then converted for points/cash modes.

### `ClaimService` (new) — verified-claims firewall
- Composes user-facing factual sentences **only** from `verifiedAmenities`, pricing,
  `neighborhood`, `bedType`.
- `claimAmenities(hotel, requested[]) → { has: [...], missing: [...] }`.
- `whyThisHotel(hotel, criteria) → string` (templated from matched verified facts).
- **Single chokepoint:** nothing user-facing about a hotel renders except through
  `ClaimService`. This is what makes "no hallucination" testable.

### `MatchService` (new)
- `score(hotel, criteria) → { score, reasons[], misses[] }`.
- `inventoryCounts(hotels, candidateRefinements[]) → live "N of 6" counts`, filtering out
  any refinement with zero results (no-dead-end rule).

### `SearchStrategyService` (new)
- Reads the flag (default `CONCIERGE`) from app config; exposes active strategy object.

The two non-negotiables live entirely in `PricingService` + `ClaimService`.

## 6. The planner (Gemini becomes a router, not a writer)

Gemini returns only a structured plan; it never emits hotel facts or prose claims.

```ts
interface TurnPlan {
  intent: IntentType;              // existing enum, reused
  criteria: SearchCriteria;        // extended: must-have vs nice-to-have flags
  needsClarification: boolean;     // model's ambiguity judgment
  clarifier?: {
    dimension: string;             // e.g. "rooftop_bar" — MUST be inventory-varying
    kind: 'must_vs_nice' | 'pick_one' | 'confirm';
  };
  shouldSearch: boolean;
  // NO message field used for hotel facts
}
```

- **Clarifying question:** templated from `clarifier.kind` + dimension label. The model only
  *chooses the dimension*; the app writes the words — and only if that dimension actually
  splits inventory (grounding guard via `MatchService`). Non-varying dimension → drop the
  clarifier, go straight to results.
- **Result intro / why-this-hotel:** composed by `ClaimService` from verified facts.
- **Ambiguity detection:** model flags it; the app validates — a clarifier survives only if
  (a) the dimension varies across the result set and (b) the user hasn't already pinned it
  as must/nice.
- **Fallback:** if Gemini is unavailable, a deterministic rule-based planner emits the same
  `TurnPlan` shape so behavior is identical offline.

**Safety property:** even a fully hallucinated model response cannot surface a fake amenity,
because the model's output is never rendered as a hotel fact — only `ClaimService` output is.

## 7. CONCIERGE turn flow

1. User asks → `planTurn()` → `TurnPlan`.
2. Clarify only if genuinely ambiguous + inventory-varying: render one templated clarifier
   with quick-reply chips (e.g. *Must-have* / *Nice-to-have*). Answer updates `criteria`; no
   second clarifier.
3. Search + score: `HotelService.filter` → `MatchService.score` → `HotelResultVM[]`.
4. Refinement chips with live counts (e.g. "Rooftop bar · 3 of 6"); every chip ≥1 result;
   tapping adds the criterion and re-ranks. Top 4 visible, rest behind "more".
5. Detail "why this hotel": `ClaimService.whyThisHotel()`, then verified amenities (✓) and
   honest misses (✗), then all-in itemization.

### View-models

```ts
interface HotelResultVM {
  hotel: Hotel;
  allInPrimary: string;     // big number
  finePrint: string;        // "$X room + $Y fees"
  bedType: string;
  reason: string;           // why-this-hotel (ClaimService)
  verified: {id,label}[];   // ✓
  misses:   {id,label}[];   // ✗
  score?: number;
}
interface TurnView {
  clarifier?: { text: string; chips: QuickReply[] };
  intro: string;            // ClaimService-composed
  results: HotelResultVM[];
  refinementChips: { label: string; count: string; criterion }[];
}
```

Every card shows all-in price + bed type + reason — the three mandated signals — from the VM.

## 8. Components (reuse, don't reinvent)

- `hotel-card` → renders `HotelResultVM`: all-in price as the big number (replaces
  "From $X / night"), fine-print becomes `"$X room + $Y taxes & fees"`, adds bed-type row and
  reason line. Existing `% match` badge stays, fed by `MatchService.score`.
- `chat` → renders `TurnView`: optional clarifier bubble with quick-reply chips, composed
  intro, existing inline card scroll, then the refinement-chip row.
- `hotel-detail-drawer` / `bottom-sheet` → existing ✓/✗ Amenities section reads
  `verified`/`misses` from the VM; adds a "Why this hotel" block at top and all-in
  itemization (room × nights + taxes/fees → total) in the booking area.
- map pins → pin label shows all-in price.
- New tiny components: `clarifier-prompt` (question + chips) and `refinement-chips` (count
  chips). Both keyboard-navigable.

No `*ngIf="strategy===…"` in any component.

## 9. Accessibility

- ✓/✗ states use icon + text label ("Has rooftop bar" / "No pool"), never color alone.
- Refinement chips and quick-replies are real `<button>`s, arrow-key navigable, with
  `aria-pressed`/counts in the accessible name.

## 10. Testing (the non-negotiables get hard tests)

- `ClaimService`: never emits a label absent from `verifiedAmenities` — property-based test
  over random criteria.
- `PricingService`: all-in = room + fees; the primary formatter never returns a bare base
  rate.
- `MatchService`: `inventoryCounts` never returns a zero-count chip.
- Planner: a deliberately hallucinated model payload produces no hotel-fact text in the
  rendered VM.
- Strategy: flipping the flag swaps behavior with components unchanged.

## 11. Acceptance criteria

- [ ] All-in total is the primary price in chat, pins, cards, and detail; base/fees are fine
      print only.
- [ ] The assistant never states an amenity not in a result's verified list; misses render
      as honest ✗.
- [ ] Every results card shows bed type and a reason/score.
- [ ] `SearchStrategy` flag switches behavior with no fork; `CONCIERGE` is default.
- [ ] CONCIERGE: clarifying question precedes results only when genuinely ambiguous;
      refinement chips show live counts and never offer a zero-result option.
- [ ] Matches the intent of `AI Search Directions.html` (visual reference, not literal
      markup).

## 12. Out of scope (follow-on specs)

Directions RECEIPTS, ALL_IN, COMPARE, SCORECARD, TRIP_CANVAS. Their data needs are already
provisioned in the contract (neighborhood, pointsEarned, walkToDiningMin) so later specs add
strategy classes + UI only.
