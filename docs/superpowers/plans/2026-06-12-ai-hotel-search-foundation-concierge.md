# AI Hotel Search — Foundation + CONCIERGE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared foundation (all-in pricing, verified-only claims, strategy flag, new data contract) plus the CONCIERGE strategy as the default, behind one `SearchStrategy` enum so future directions don't fork the codebase.

**Architecture:** Approach A — a `SearchStrategyService` exposes the active strategy object; strategies call a Gemini *planner* (`planTurn`) and build view-models (`buildView`). All rule-bearing logic lives once in shared core services: `PricingService` (all-in), `ClaimService` (verified-claims firewall), `MatchService` (scoring, reasons, live inventory counts). Components are dumb renderers of view-models.

**Tech Stack:** Angular 17 (standalone components, OnPush), TypeScript, Jest (`jest-preset-angular`), RxJS, Google Gemini 2.5 Flash REST.

**Test command:** `npx jest <path>` (single file) or `npx jest` (all). Build check: `npx ng build --configuration development`.

---

## File Structure

**New files**
- `src/app/models/search-strategy.model.ts` — `SearchStrategy` enum, `TurnPlan`, `TurnView`, `HotelResultVM`, `QuickReply`, `RefinementChip`, `Criterion`.
- `src/app/strategies/search-strategy.interface.ts` — `ISearchStrategy`.
- `src/app/strategies/concierge.strategy.ts` — CONCIERGE implementation.
- `src/app/services/search-strategy.service.ts` — reads flag, returns active strategy.
- `src/app/services/claim.service.ts` — verified-claims firewall.
- `src/app/services/match.service.ts` — scoring, reasons, inventory counts.
- `src/app/components/clarifier-prompt.component.ts` (+ `.html`, `.css`) — clarifying question + chips.
- `src/app/components/refinement-chips.component.ts` (+ `.html`, `.css`) — live-count chips.
- Spec files alongside each service/strategy.

**Modified files**
- `src/app/models/hotel.model.ts` — new fields.
- `src/app/models/index.ts` — export new models.
- `src/environments/environment.ts` + `environment.prod.ts` — `searchStrategy` default.
- `src/assets/hotels.json` — author new data for 6 hotels.
- `src/app/services/hotel.service.ts` — `transformRawHotel` derives `allInNightly`; passes new fields.
- `src/app/services/pricing.service.ts` — all-in methods.
- `src/app/services/ai.service.ts` — add `planTurn` + rule-based fallback emitting `TurnPlan`.
- `src/app/components/hotel-card.component.{ts,html,css}` — all-in, bed type, reason.
- `src/app/components/chat.component.{ts,html}` — render clarifier + refinement chips + intro.
- `src/app/components/hotel-detail-drawer.component.{ts,html}` and `hotel-detail-bottom-sheet.component.{ts,html}` — "Why this hotel" + all-in itemization; verified/misses from data.
- `src/app/app.component.ts` — wire the turn flow through `SearchStrategyService`.

---

## Phase 1 — Data foundation

### Task 1: SearchStrategy enum, flag, and SearchStrategyService

**Files:**
- Create: `src/app/models/search-strategy.model.ts`
- Modify: `src/environments/environment.ts`, `src/environments/environment.prod.ts`
- Create: `src/app/services/search-strategy.service.ts`
- Create: `src/app/services/search-strategy.service.spec.ts`
- Modify: `src/app/models/index.ts`

- [ ] **Step 1: Create the model file with the enum (other types added in Task 9).**

```ts
// src/app/models/search-strategy.model.ts
export enum SearchStrategy {
  RECEIPTS = 'RECEIPTS',
  ALL_IN = 'ALL_IN',
  COMPARE = 'COMPARE',
  SCORECARD = 'SCORECARD',
  CONCIERGE = 'CONCIERGE',
  TRIP_CANVAS = 'TRIP_CANVAS',
}
```

- [ ] **Step 2: Export it from the models barrel.**

Add to `src/app/models/index.ts`:
```ts
export * from './search-strategy.model';
```

- [ ] **Step 3: Add the default flag to both environments.**

In `src/environments/environment.ts`, add the field:
```ts
export const environment = {
  production: false,
  apiConfigEndpoint: '/api/config',
  searchStrategy: 'CONCIERGE',
};
```
In `src/environments/environment.prod.ts`, add `searchStrategy: 'CONCIERGE',` to the exported object the same way.

- [ ] **Step 4: Write the failing test for the service.**

```ts
// src/app/services/search-strategy.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { SearchStrategyService } from './search-strategy.service';
import { SearchStrategy } from '../models/search-strategy.model';

describe('SearchStrategyService', () => {
  let service: SearchStrategyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchStrategyService);
  });

  it('defaults to CONCIERGE', () => {
    expect(service.active).toBe(SearchStrategy.CONCIERGE);
  });

  it('can switch strategy at runtime', () => {
    service.setStrategy(SearchStrategy.COMPARE);
    expect(service.active).toBe(SearchStrategy.COMPARE);
  });

  it('falls back to CONCIERGE for an unknown flag value', () => {
    service.setStrategyFromString('NONSENSE');
    expect(service.active).toBe(SearchStrategy.CONCIERGE);
  });
});
```

- [ ] **Step 5: Run it; expect failure.**

Run: `npx jest src/app/services/search-strategy.service.spec.ts`
Expected: FAIL — `SearchStrategyService` not found.

- [ ] **Step 6: Implement the service.**

```ts
// src/app/services/search-strategy.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SearchStrategy } from '../models/search-strategy.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SearchStrategyService {
  private subject: BehaviorSubject<SearchStrategy>;
  strategy$;

  constructor() {
    this.subject = new BehaviorSubject<SearchStrategy>(this.parse(environment.searchStrategy));
    this.strategy$ = this.subject.asObservable();
  }

  get active(): SearchStrategy {
    return this.subject.value;
  }

  setStrategy(strategy: SearchStrategy): void {
    this.subject.next(strategy);
  }

  setStrategyFromString(value: string): void {
    this.subject.next(this.parse(value));
  }

  private parse(value: string | undefined): SearchStrategy {
    const match = (Object.values(SearchStrategy) as string[]).includes(value ?? '');
    return match ? (value as SearchStrategy) : SearchStrategy.CONCIERGE;
  }
}
```

- [ ] **Step 7: Run it; expect pass.**

Run: `npx jest src/app/services/search-strategy.service.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit.**

```bash
git add src/app/models/search-strategy.model.ts src/app/models/index.ts \
  src/environments/environment.ts src/environments/environment.prod.ts \
  src/app/services/search-strategy.service.ts src/app/services/search-strategy.service.spec.ts
git commit -m "feat: SearchStrategy enum + flag + SearchStrategyService (default CONCIERGE)"
```

---

### Task 2: Extend the Hotel model

**Files:**
- Modify: `src/app/models/hotel.model.ts`

- [ ] **Step 1: Add the new fields.** Insert these into the `Hotel` interface (keep all existing fields, including `amenities: string[]` and `matchScore?`/`matchContext?`):

```ts
  // All-in pricing — derived, authoritative
  // (added inside the existing `pricing` object type)
  // pricing.allInNightly: number;  // see below

  bedType: string;                                  // e.g. "1 King", "2 Queen"
  verifiedAmenities: { id: string; label: string }[]; // ONLY claimable amenity set
  missingAmenities: { id: string; label: string }[];  // honest ✗
  neighborhood: {
    name: string;
    vibe: string[];
    walkScore: number;
    nearby: string[];
  };
  pointsEarned: number;
  walkToDiningMin: number;
```

Change the `pricing` member to include `allInNightly`:
```ts
  pricing: {
    nightlyRate: number;
    roomRate: number;
    fees: number;
    allInNightly: number; // NEW — derived: roomRate + fees
  };
```

- [ ] **Step 2: Verify it compiles (type-only change).**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: errors ONLY in files that build `Hotel` literals (hotel.service transform, specs). These are fixed in Tasks 3–4 and 10. Confirm there are no syntax errors in `hotel.model.ts` itself.

- [ ] **Step 3: Commit.**

```bash
git add src/app/models/hotel.model.ts
git commit -m "feat: add all-in, bedType, verified/missing amenities, neighborhood to Hotel model"
```

---

### Task 3: Author hotel data + derive all-in in the transform

**Files:**
- Modify: `src/assets/hotels.json`
- Modify: `src/app/services/hotel.service.ts` (`transformRawHotel`)
- Test: `src/app/services/hotel.service.spec.ts`

- [ ] **Step 1: Add new fields to every hotel in `hotels.json`.** For EACH of the 6 hotels, add the following keys (values below are the template; fill realistic per-hotel values — vary them so amenities differ across hotels for the inventory-count logic). Example for `NYCXV` (voco Times Square – Broadway):

```json
{
  "bedType": "1 King",
  "verifiedAmenities": [
    { "id": "rooftop_bar", "label": "Rooftop Bar" },
    { "id": "fitness_center", "label": "Fitness Center" },
    { "id": "free_wifi", "label": "Free Wi-Fi" }
  ],
  "missingAmenities": [
    { "id": "pool", "label": "Pool" },
    { "id": "spa", "label": "Spa" }
  ],
  "neighborhood": {
    "name": "Theater District",
    "vibe": ["lively", "walkable"],
    "walkScore": 98,
    "nearby": ["Times Square 2 min", "Bryant Park 6 min", "Broadway theaters 1 min"]
  },
  "pointsEarned": 9500,
  "walkToDiningMin": 2
}
```

Authoring rules:
- Migrate each hotel's existing `amenities` strings into `verifiedAmenities` (assign a stable `id` = lowercased, underscored label).
- Give each hotel 1–3 plausible `missingAmenities` drawn from this shared vocabulary so chips can compare: `pool`, `spa`, `restaurant`, `rooftop_bar`, `pet_friendly`, `free_parking`. Ensure at least one amenity (e.g. `rooftop_bar`) is present in SOME hotels and missing in others.
- `neighborhood.name` should reuse the existing `location.neighborhood`. Vibes drawn from: `romantic`, `quiet`, `lively`, `walkable`, `nightlife`.

- [ ] **Step 2: Write the failing test for the transform deriving all-in.**

Add to `src/app/services/hotel.service.spec.ts` (inside the top-level `describe`):
```ts
it('derives allInNightly as roomRate + fees in transform', (done) => {
  service.loadHotels().subscribe(hotels => {
    const h = hotels[0];
    expect(h.pricing.allInNightly).toBe(h.pricing.roomRate + h.pricing.fees);
    expect(h.verifiedAmenities.length).toBeGreaterThan(0);
    expect(typeof h.bedType).toBe('string');
    done();
  });
  const req = httpMock.expectOne('assets/hotels.json');
  req.flush([
    {
      id: 'T1', name: 'Test', brand: 'voco', rating: 4,
      location: { address: 'a', neighborhood: 'Theater District', coordinates: { lat: 1, lng: 2 } },
      pricing: { nightlyRate: 300, roomRate: 300, fees: 60 },
      amenities: ['Rooftop Bar'],
      verifiedAmenities: [{ id: 'rooftop_bar', label: 'Rooftop Bar' }],
      missingAmenities: [{ id: 'pool', label: 'Pool' }],
      neighborhood: { name: 'Theater District', vibe: ['lively'], walkScore: 98, nearby: ['x'] },
      bedType: '1 King', pointsEarned: 9000, walkToDiningMin: 2,
      description: '', imageUrls: [], phone: ''
    }
  ]);
});
```

- [ ] **Step 3: Run it; expect failure.**

Run: `npx jest src/app/services/hotel.service.spec.ts -t "derives allInNightly"`
Expected: FAIL — `allInNightly` is `undefined`.

- [ ] **Step 4: Update `transformRawHotel`.** In `src/app/services/hotel.service.ts`, replace the `pricing` object and add new fields in the returned object:

```ts
      pricing: {
        nightlyRate: raw.pricing?.nightlyRate || raw.price?.nightlyRate || 0,
        roomRate: raw.pricing?.roomRate || raw.price?.amount || 0,
        fees: raw.pricing?.fees || (raw.price?.amount - raw.price?.nightlyRate) || 0,
        allInNightly:
          (raw.pricing?.roomRate || raw.price?.amount || 0) +
          (raw.pricing?.fees || (raw.price?.amount - raw.price?.nightlyRate) || 0),
      },
      amenities: raw.amenities || [],
      bedType: raw.bedType || '',
      verifiedAmenities: raw.verifiedAmenities || [],
      missingAmenities: raw.missingAmenities || [],
      neighborhood: raw.neighborhood || {
        name: raw.location?.neighborhood || '', vibe: [], walkScore: 0, nearby: []
      },
      pointsEarned: raw.pointsEarned || 0,
      walkToDiningMin: raw.walkToDiningMin ?? 0,
```
(Keep the remaining existing fields — `description`, `imageUrls`, `phone`, `sentiment`, `bookingUrl`, `badge`, `pointsCash`.)

- [ ] **Step 5: Run it; expect pass.**

Run: `npx jest src/app/services/hotel.service.spec.ts -t "derives allInNightly"`
Expected: PASS.

- [ ] **Step 6: Run the full hotel.service spec to catch mock breakage.**

Run: `npx jest src/app/services/hotel.service.spec.ts`
Expected: PASS. If existing `mockHotels` literals now fail type-check at compile, add the new required fields (`bedType: ''`, `verifiedAmenities: []`, `missingAmenities: []`, `neighborhood: {name:'',vibe:[],walkScore:0,nearby:[]}`, `pointsEarned: 0`, `walkToDiningMin: 0`, and `allInNightly` in pricing) to each mock literal in that spec.

- [ ] **Step 7: Commit.**

```bash
git add src/assets/hotels.json src/app/services/hotel.service.ts src/app/services/hotel.service.spec.ts
git commit -m "feat: author verified hotel data + derive all-in nightly in transform"
```

---

### Task 4: PricingService all-in methods

**Files:**
- Modify: `src/app/services/pricing.service.ts`
- Test: `src/app/services/pricing.service.spec.ts` (create if absent)

- [ ] **Step 1: Write the failing test.**

```ts
// src/app/services/pricing.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { PricingService } from './pricing.service';
import { Hotel } from '../models/hotel.model';

function hotel(): Hotel {
  return {
    id: '1', name: 'H', brand: 'voco', rating: 4,
    location: { address: '', neighborhood: '', coordinates: { lat: 0, lng: 0 } },
    pricing: { nightlyRate: 300, roomRate: 300, fees: 60, allInNightly: 360 },
    amenities: [], bedType: '1 King',
    verifiedAmenities: [], missingAmenities: [],
    neighborhood: { name: '', vibe: [], walkScore: 0, nearby: [] },
    pointsEarned: 0, walkToDiningMin: 0,
    description: '', imageUrls: [], phone: '', sentiment: [],
  };
}

describe('PricingService all-in', () => {
  let svc: PricingService;
  beforeEach(() => { TestBed.configureTestingModule({}); svc = TestBed.inject(PricingService); });

  it('allInNightly returns roomRate + fees', () => {
    expect(svc.allInNightly(hotel())).toBe(360);
  });

  it('allInTotal multiplies by nights', () => {
    expect(svc.allInTotal(hotel(), 3)).toBe(1080);
  });

  it('formatAllIn (cash) leads with the all-in number, not the base rate', () => {
    svc.setMode('cash');
    const s = svc.formatAllIn(hotel());
    expect(s).toContain('360');
    expect(s).not.toContain('300'); // base rate must not be the primary number
  });

  it('formatFinePrint shows room + taxes & fees', () => {
    expect(svc.formatFinePrint(hotel())).toBe('$300 room + $60 taxes & fees');
  });
});
```

- [ ] **Step 2: Run it; expect failure.**

Run: `npx jest src/app/services/pricing.service.spec.ts`
Expected: FAIL — `allInNightly` not a function.

- [ ] **Step 3: Add the methods to `PricingService`.** Append inside the class:

```ts
  /** All-in per night = room + taxes & fees (authoritative). */
  allInNightly(hotel: Hotel): number {
    return Math.round(hotel.pricing.allInNightly);
  }

  /** All-in trip total once nights are known. */
  allInTotal(hotel: Hotel, nights: number): number {
    return this.allInNightly(hotel) * Math.max(1, nights);
  }

  /** Primary price string — all-in leads everywhere. */
  formatAllIn(hotel: Hotel): string {
    const allIn = this.allInNightly(hotel);
    if (this.mode === 'points') {
      return `${this.toPoints(allIn).toLocaleString()} pts`;
    }
    if (this.mode === 'points+cash' && hotel.pointsCash) {
      return `${hotel.pointsCash.points.toLocaleString()} pts + $${hotel.pointsCash.cash}`;
    }
    return `$${allIn}`;
  }

  /** Secondary fine print — base + fees only. */
  formatFinePrint(hotel: Hotel): string {
    return `$${Math.round(hotel.pricing.roomRate)} room + $${Math.round(hotel.pricing.fees)} taxes & fees`;
  }
```

- [ ] **Step 4: Run it; expect pass.**

Run: `npx jest src/app/services/pricing.service.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit.**

```bash
git add src/app/services/pricing.service.ts src/app/services/pricing.service.spec.ts
git commit -m "feat: all-in pricing methods (allInNightly/allInTotal/formatAllIn/formatFinePrint)"
```

---

## Phase 2 — Claim + Match engines

### Task 5: ClaimService (verified-claims firewall)

**Files:**
- Create: `src/app/services/claim.service.ts`
- Create: `src/app/services/claim.service.spec.ts`

- [ ] **Step 1: Write the failing tests (including a property-style guarantee).**

```ts
// src/app/services/claim.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { ClaimService } from './claim.service';
import { Hotel } from '../models/hotel.model';

function hotel(over: Partial<Hotel> = {}): Hotel {
  return {
    id: '1', name: 'voco Test', brand: 'voco', rating: 4,
    location: { address: '', neighborhood: 'Theater District', coordinates: { lat: 0, lng: 0 } },
    pricing: { nightlyRate: 300, roomRate: 300, fees: 60, allInNightly: 360 },
    amenities: ['Rooftop Bar'], bedType: '1 King',
    verifiedAmenities: [{ id: 'rooftop_bar', label: 'Rooftop Bar' }, { id: 'free_wifi', label: 'Free Wi-Fi' }],
    missingAmenities: [{ id: 'pool', label: 'Pool' }],
    neighborhood: { name: 'Theater District', vibe: ['lively', 'walkable'], walkScore: 98, nearby: ['Times Square 2 min'] },
    pointsEarned: 9000, walkToDiningMin: 2,
    description: '', imageUrls: [], phone: '', sentiment: [],
    ...over,
  };
}

describe('ClaimService', () => {
  let svc: ClaimService;
  beforeEach(() => { TestBed.configureTestingModule({}); svc = TestBed.inject(ClaimService); });

  it('claimAmenities splits requested into has/missing using ONLY verified data', () => {
    const r = svc.claimAmenities(hotel(), ['rooftop_bar', 'pool']);
    expect(r.has.map(a => a.id)).toEqual(['rooftop_bar']);
    expect(r.missing.map(a => a.id)).toEqual(['pool']);
  });

  it('never claims an amenity absent from verifiedAmenities (property-style)', () => {
    const h = hotel();
    const verifiedIds = new Set(h.verifiedAmenities.map(a => a.id));
    const candidates = ['rooftop_bar', 'pool', 'spa', 'free_wifi', 'restaurant', 'pet_friendly'];
    // try many random subsets
    for (let i = 0; i < 50; i++) {
      const requested = candidates.filter(() => Math.random() < 0.5);
      const r = svc.claimAmenities(h, requested);
      for (const claimed of r.has) {
        expect(verifiedIds.has(claimed.id)).toBe(true);
      }
    }
  });

  it('whyThisHotel only references verified facts and bed type', () => {
    const s = svc.whyThisHotel(hotel(), { amenities: ['rooftop_bar'] } as any);
    expect(s).toContain('Rooftop Bar');
    expect(s).not.toContain('Pool'); // a miss must never appear as a reason
  });
});
```

- [ ] **Step 2: Run; expect failure.**

Run: `npx jest src/app/services/claim.service.spec.ts`
Expected: FAIL — `ClaimService` not found.

- [ ] **Step 3: Implement `ClaimService`.**

```ts
// src/app/services/claim.service.ts
import { Injectable } from '@angular/core';
import { Hotel } from '../models/hotel.model';
import { SearchCriteria } from '../models/search-criteria.model';

export interface AmenityRef { id: string; label: string; }

@Injectable({ providedIn: 'root' })
export class ClaimService {
  /**
   * Split the requested amenity ids into those the hotel verifiably has and
   * those it does not. Reads ONLY verifiedAmenities — the single claim source.
   */
  claimAmenities(hotel: Hotel, requestedIds: string[]): { has: AmenityRef[]; missing: AmenityRef[] } {
    const verified = hotel.verifiedAmenities ?? [];
    const verifiedById = new Map(verified.map(a => [a.id, a]));
    const has: AmenityRef[] = [];
    const missing: AmenityRef[] = [];
    for (const id of requestedIds) {
      const hit = verifiedById.get(id);
      if (hit) {
        has.push(hit);
      } else {
        const known = (hotel.missingAmenities ?? []).find(a => a.id === id);
        missing.push(known ?? { id, label: this.humanize(id) });
      }
    }
    return { has, missing };
  }

  /**
   * Compose a "why this hotel" sentence from verified facts only.
   * Never references a missing amenity.
   */
  whyThisHotel(hotel: Hotel, criteria: SearchCriteria | null | undefined): string {
    const reasons: string[] = [];
    const requested = (criteria?.amenities ?? []).map(a => this.toId(a));
    const { has } = this.claimAmenities(hotel, requested);
    if (has.length) {
      reasons.push(`has ${this.list(has.map(a => a.label))}`);
    }
    if (hotel.bedType) {
      reasons.push(`offers a ${hotel.bedType} room`);
    }
    if (hotel.neighborhood?.vibe?.length) {
      reasons.push(`sits in ${hotel.neighborhood.name} (${hotel.neighborhood.vibe.join(', ')})`);
    }
    if (!reasons.length) {
      return `A solid match in ${hotel.neighborhood?.name || 'the area'}.`;
    }
    return `This one ${reasons.join('; ')}.`;
  }

  private list(labels: string[]): string {
    if (labels.length <= 1) return labels[0] ?? '';
    return labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1];
  }
  private toId(label: string): string {
    return label.toLowerCase().trim().replace(/\s+/g, '_');
  }
  private humanize(id: string): string {
    return id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
}
```

- [ ] **Step 4: Run; expect pass.**

Run: `npx jest src/app/services/claim.service.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit.**

```bash
git add src/app/services/claim.service.ts src/app/services/claim.service.spec.ts
git commit -m "feat: ClaimService verified-claims firewall (claimAmenities/whyThisHotel)"
```

---

### Task 6: MatchService — score + reasons

**Files:**
- Create: `src/app/services/match.service.ts`
- Create: `src/app/services/match.service.spec.ts`

- [ ] **Step 1: Write the failing test.**

```ts
// src/app/services/match.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { MatchService } from './match.service';
import { ClaimService } from './claim.service';
import { Hotel } from '../models/hotel.model';

function hotel(verified: {id:string;label:string}[]): Hotel {
  return {
    id: 'x', name: 'H', brand: 'voco', rating: 4,
    location: { address: '', neighborhood: 'Theater District', coordinates: { lat: 0, lng: 0 } },
    pricing: { nightlyRate: 300, roomRate: 300, fees: 60, allInNightly: 360 },
    amenities: [], bedType: '1 King',
    verifiedAmenities: verified, missingAmenities: [],
    neighborhood: { name: 'Theater District', vibe: ['lively'], walkScore: 98, nearby: [] },
    pointsEarned: 0, walkToDiningMin: 2,
    description: '', imageUrls: [], phone: '', sentiment: [],
  };
}

describe('MatchService.score', () => {
  let svc: MatchService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MatchService, ClaimService] });
    svc = TestBed.inject(MatchService);
  });

  it('scores a full amenity match higher than a partial one', () => {
    const full = svc.score(hotel([{id:'rooftop_bar',label:'Rooftop Bar'}]), { amenities: ['rooftop_bar'] });
    const none = svc.score(hotel([]), { amenities: ['rooftop_bar'] });
    expect(full.score).toBeGreaterThan(none.score);
    expect(full.reasons.length).toBeGreaterThan(0);
    expect(none.misses.map(m => m.id)).toContain('rooftop_bar');
  });
});
```

- [ ] **Step 2: Run; expect failure.**

Run: `npx jest src/app/services/match.service.spec.ts`
Expected: FAIL — `MatchService` not found.

- [ ] **Step 3: Implement `score` (inventory counts added in Task 7).**

```ts
// src/app/services/match.service.ts
import { Injectable } from '@angular/core';
import { Hotel } from '../models/hotel.model';
import { SearchCriteria } from '../models/search-criteria.model';
import { ClaimService, AmenityRef } from './claim.service';

export interface MatchResult {
  score: number;              // 0–99
  reasons: AmenityRef[];      // verified hits that matched the request
  misses: AmenityRef[];       // honest ✗
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  constructor(private claims: ClaimService) {}

  score(hotel: Hotel, criteria: SearchCriteria | null | undefined): MatchResult {
    const requested = (criteria?.amenities ?? []).map(a => a.toLowerCase().trim().replace(/\s+/g, '_'));
    const { has, missing } = this.claims.claimAmenities(hotel, requested);

    let pct: number;
    if (requested.length > 0) {
      pct = has.length / requested.length;            // amenity coverage
    } else {
      pct = Math.max(0, Math.min(1, (hotel.rating - 3) / 2)); // quality proxy
    }
    const score = Math.min(Math.round(75 + pct * 24), 99);
    return { score, reasons: has, misses: missing };
  }
}
```

- [ ] **Step 4: Run; expect pass.**

Run: `npx jest src/app/services/match.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/app/services/match.service.ts src/app/services/match.service.spec.ts
git commit -m "feat: MatchService.score with verified reasons and honest misses"
```

---

### Task 7: MatchService — live inventory counts (no dead ends)

**Files:**
- Modify: `src/app/services/match.service.ts`
- Modify: `src/app/services/match.service.spec.ts`

- [ ] **Step 1: Write the failing test.**

```ts
// append to src/app/services/match.service.spec.ts
import { RefinementCandidate } from './match.service';

describe('MatchService.inventoryCounts', () => {
  let svc: MatchService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MatchService, ClaimService] });
    svc = TestBed.inject(MatchService);
  });

  it('returns live counts and drops zero-result candidates', () => {
    const hotels = [
      hotel([{ id: 'rooftop_bar', label: 'Rooftop Bar' }]),
      hotel([]),
    ];
    const candidates: RefinementCandidate[] = [
      { label: 'Rooftop bar', criterion: { kind: 'amenity', value: 'rooftop_bar' } },
      { label: 'Pool',        criterion: { kind: 'amenity', value: 'pool' } }, // 0 hotels → dropped
    ];
    const chips = svc.inventoryCounts(hotels, candidates);
    expect(chips.find(c => c.label === 'Rooftop bar')?.count).toBe('1 of 2');
    expect(chips.find(c => c.label === 'Pool')).toBeUndefined();
  });
});
```

Note: `hotel()` here is the helper from the first `describe` — move it to module scope (above both `describe`s) so both can use it.

- [ ] **Step 2: Run; expect failure.**

Run: `npx jest src/app/services/match.service.spec.ts -t inventoryCounts`
Expected: FAIL — `inventoryCounts` not a function / `RefinementCandidate` not exported.

- [ ] **Step 3: Add types + method to `MatchService`.**

```ts
// add to match.service.ts
export interface Criterion { kind: 'amenity' | 'neighborhood' | 'vibe'; value: string; }
export interface RefinementCandidate { label: string; criterion: Criterion; }
export interface RefinementChipVM { label: string; count: string; criterion: Criterion; }
```

```ts
  /** Count how many hotels satisfy each candidate; drop zero-result candidates. */
  inventoryCounts(hotels: Hotel[], candidates: RefinementCandidate[]): RefinementChipVM[] {
    const total = hotels.length;
    const chips: RefinementChipVM[] = [];
    for (const c of candidates) {
      const n = hotels.filter(h => this.satisfies(h, c.criterion)).length;
      if (n > 0) {
        chips.push({ label: c.label, count: `${n} of ${total}`, criterion: c.criterion });
      }
    }
    return chips;
  }

  private satisfies(hotel: Hotel, criterion: Criterion): boolean {
    switch (criterion.kind) {
      case 'amenity':
        return (hotel.verifiedAmenities ?? []).some(a => a.id === criterion.value);
      case 'neighborhood':
        return hotel.neighborhood?.name?.toLowerCase() === criterion.value.toLowerCase();
      case 'vibe':
        return (hotel.neighborhood?.vibe ?? []).map(v => v.toLowerCase()).includes(criterion.value.toLowerCase());
    }
  }
```

- [ ] **Step 4: Run; expect pass.**

Run: `npx jest src/app/services/match.service.spec.ts`
Expected: PASS (both describes).

- [ ] **Step 5: Commit.**

```bash
git add src/app/services/match.service.ts src/app/services/match.service.spec.ts
git commit -m "feat: MatchService.inventoryCounts with no-dead-end guarantee"
```

---

## Phase 3 — Planner

### Task 8: TurnPlan model + AIService.planTurn + rule-based fallback

**Files:**
- Modify: `src/app/models/search-strategy.model.ts` (add `TurnPlan`)
- Modify: `src/app/services/ai.service.ts`
- Modify: `src/app/services/ai.service.spec.ts`

- [ ] **Step 1: Add `TurnPlan` to the model file.**

```ts
// add to src/app/models/search-strategy.model.ts
import { IntentType } from './conversation-state.model';
import { SearchCriteria } from './search-criteria.model';

export interface TurnPlan {
  intent: IntentType;
  criteria: SearchCriteria;
  needsClarification: boolean;
  clarifier?: { dimension: string; kind: 'must_vs_nice' | 'pick_one' | 'confirm' };
  shouldSearch: boolean;
}
```

- [ ] **Step 2: Write the failing test for the rule-based fallback planner.**

```ts
// append to src/app/services/ai.service.spec.ts (reuse the existing TestBed setup there)
import { TurnPlan } from '../models/search-strategy.model';

describe('AIService.fallbackPlan', () => {
  let service: AIService;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AIService);
  });

  it('builds a TurnPlan with criteria from keywords and no hotel-fact text', () => {
    const plan: TurnPlan = service.fallbackPlan('rooftop bar hotel in nyc');
    expect(plan.criteria.amenities).toContain('rooftop bar');
    expect(plan.shouldSearch).toBe(true);
    // the plan object carries NO free-text message field for hotel facts
    expect((plan as any).message).toBeUndefined();
  });
});
```

(If `ai.service.spec.ts` lacks `HttpClientTestingModule`, import it from `@angular/common/http/testing` at the top.)

- [ ] **Step 3: Run; expect failure.**

Run: `npx jest src/app/services/ai.service.spec.ts -t fallbackPlan`
Expected: FAIL — `fallbackPlan` not a function.

- [ ] **Step 4: Add `planTurn` and `fallbackPlan` to `AIService`.** Add these public methods (leave existing `processQuery` intact for now — Task 18 swaps callers):

```ts
  /** Planner entry point: returns a structured TurnPlan (never hotel-fact prose). */
  planTurn(query: string, state: ConversationState): Observable<TurnPlan> {
    const apiKey = this.configService.getApiKey();
    if (!apiKey) {
      return of(this.fallbackPlan(query));
    }
    const prompt = this.buildPlannerPrompt(query, state);
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
    };
    const url = `${this.GEMINI_API_URL}?key=${apiKey}`;
    return this.http.post(url, payload, { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }).pipe(
      timeout(this.TIMEOUT_MS),
      map(res => this.parsePlan(res, query)),
      catchError(() => of(this.fallbackPlan(query))),
    );
  }

  /** Deterministic planner used when Gemini is unavailable. */
  fallbackPlan(query: string): TurnPlan {
    const q = query.toLowerCase();
    const amenityVocab: Record<string, string> = {
      'rooftop bar': 'rooftop bar', 'rooftop': 'rooftop bar',
      'pool': 'pool', 'spa': 'spa', 'gym': 'fitness center', 'fitness': 'fitness center',
      'wifi': 'free wi-fi', 'wi-fi': 'free wi-fi', 'pet': 'pet friendly', 'restaurant': 'restaurant',
    };
    const amenities: string[] = [];
    for (const k of Object.keys(amenityVocab)) {
      if (q.includes(k) && !amenities.includes(amenityVocab[k])) amenities.push(amenityVocab[k]);
    }
    const criteria: SearchCriteria = {};
    if (amenities.length) criteria.amenities = amenities;
    return {
      intent: amenities.length ? 'complete_query' : 'vague',
      criteria,
      needsClarification: false,
      shouldSearch: true,
    };
  }

  /** Parse a Gemini planner response into a TurnPlan; fall back on any problem. */
  private parsePlan(response: any, query: string): TurnPlan {
    try {
      const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
      const obj = JSON.parse(text);
      return {
        intent: obj.intent ?? 'complete_query',
        criteria: obj.criteria ?? {},
        needsClarification: !!obj.needsClarification,
        clarifier: obj.clarifier,
        shouldSearch: obj.shouldSearch !== false,
      };
    } catch {
      return this.fallbackPlan(query);
    }
  }

  /** Planner prompt: instruct the model to emit ONLY a plan, never hotel facts. */
  private buildPlannerPrompt(query: string, state: ConversationState): string {
    return [
      'You are a search PLANNER for a hotel assistant. You do NOT describe hotels.',
      'Return ONLY JSON: { "intent": string, "criteria": { "amenities"?: string[], "sentiments"?: string[], "priceRange"?: {"min"?:number,"max"?:number}, "minRating"?: number }, "needsClarification": boolean, "clarifier"?: { "dimension": string, "kind": "must_vs_nice"|"pick_one"|"confirm" }, "shouldSearch": boolean }.',
      'Set needsClarification=true ONLY when the request is genuinely ambiguous about a must-have vs nice-to-have preference. Never invent amenities the user did not mention.',
      `User query: ${query}`,
      state.lastQuery ? `Previous query: ${state.lastQuery}` : '',
    ].join('\n');
  }
```

Ensure `TurnPlan` is imported at the top of `ai.service.ts`:
```ts
import { TurnPlan } from '../models/search-strategy.model';
```

- [ ] **Step 5: Run; expect pass.**

Run: `npx jest src/app/services/ai.service.spec.ts -t fallbackPlan`
Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add src/app/models/search-strategy.model.ts src/app/services/ai.service.ts src/app/services/ai.service.spec.ts
git commit -m "feat: planner (planTurn) + deterministic fallbackPlan emitting TurnPlan"
```

---

## Phase 4 — Strategy + view-models

### Task 9: View-model + strategy interfaces

**Files:**
- Modify: `src/app/models/search-strategy.model.ts` (add VMs)
- Create: `src/app/strategies/search-strategy.interface.ts`

- [ ] **Step 1: Add the view-model types to the model file.**

```ts
// add to src/app/models/search-strategy.model.ts
import { Hotel } from './hotel.model';
import { Criterion, RefinementChipVM } from '../services/match.service';

export interface QuickReply { label: string; value: string; }

export interface HotelResultVM {
  hotel: Hotel;
  allInPrimary: string;     // big number, e.g. "$360"
  finePrint: string;        // "$300 room + $60 taxes & fees"
  bedType: string;
  reason: string;           // why-this-hotel (ClaimService)
  verified: { id: string; label: string }[];
  misses: { id: string; label: string }[];
  score?: number;
}

export interface TurnView {
  clarifier?: { text: string; chips: QuickReply[] };
  intro: string;
  results: HotelResultVM[];
  refinementChips: RefinementChipVM[];
}
```

- [ ] **Step 2: Create the strategy interface.**

```ts
// src/app/strategies/search-strategy.interface.ts
import { Observable } from 'rxjs';
import { Hotel } from '../models/hotel.model';
import { ConversationState } from '../models/conversation-state.model';
import { TurnPlan, TurnView } from '../models/search-strategy.model';

export interface ISearchStrategy {
  /** Ask the planner what to do this turn. */
  planTurn(query: string, state: ConversationState): Observable<TurnPlan>;
  /** Build the view-model the components render. */
  buildView(query: string, plan: TurnPlan, hotels: Hotel[]): TurnView;
}
```

- [ ] **Step 3: Type-check.**

Run: `npx tsc --noEmit -p tsconfig.app.json`
Expected: no new errors in these two files.

- [ ] **Step 4: Commit.**

```bash
git add src/app/models/search-strategy.model.ts src/app/strategies/search-strategy.interface.ts
git commit -m "feat: TurnView/HotelResultVM view-models + ISearchStrategy interface"
```

---

### Task 10: ConciergeStrategy.buildView

**Files:**
- Create: `src/app/strategies/concierge.strategy.ts`
- Create: `src/app/strategies/concierge.strategy.spec.ts`

- [ ] **Step 1: Write the failing test.**

```ts
// src/app/strategies/concierge.strategy.spec.ts
import { TestBed } from '@angular/core/testing';
import { ConciergeStrategy } from './concierge.strategy';
import { ClaimService } from '../services/claim.service';
import { MatchService } from '../services/match.service';
import { PricingService } from '../services/pricing.service';
import { AIService } from '../services/ai.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Hotel } from '../models/hotel.model';
import { TurnPlan } from '../models/search-strategy.model';

function hotel(verified: {id:string;label:string}[], miss: {id:string;label:string}[] = []): Hotel {
  return {
    id: 'x', name: 'voco H', brand: 'voco', rating: 4,
    location: { address: '', neighborhood: 'Theater District', coordinates: { lat: 0, lng: 0 } },
    pricing: { nightlyRate: 300, roomRate: 300, fees: 60, allInNightly: 360 },
    amenities: [], bedType: '1 King',
    verifiedAmenities: verified, missingAmenities: miss,
    neighborhood: { name: 'Theater District', vibe: ['lively'], walkScore: 98, nearby: [] },
    pointsEarned: 0, walkToDiningMin: 2,
    description: '', imageUrls: [], phone: '', sentiment: [],
  };
}

describe('ConciergeStrategy.buildView', () => {
  let strat: ConciergeStrategy;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConciergeStrategy, ClaimService, MatchService, PricingService, AIService],
    });
    strat = TestBed.inject(ConciergeStrategy);
  });

  it('builds result VMs with all-in primary, bed type, reason, verified/misses', () => {
    const plan: TurnPlan = { intent: 'complete_query', criteria: { amenities: ['rooftop_bar'] }, needsClarification: false, shouldSearch: true };
    const hotels = [hotel([{id:'rooftop_bar',label:'Rooftop Bar'}], [{id:'pool',label:'Pool'}])];
    const view = strat.buildView('rooftop bar', plan, hotels);
    const vm = view.results[0];
    expect(vm.allInPrimary).toBe('$360');
    expect(vm.finePrint).toContain('room');
    expect(vm.bedType).toBe('1 King');
    expect(vm.reason).toContain('Rooftop Bar');
    expect(vm.verified.map(v => v.id)).toContain('rooftop_bar');
  });

  it('emits refinement chips with live counts and never a zero-count chip', () => {
    const plan: TurnPlan = { intent: 'complete_query', criteria: {}, needsClarification: false, shouldSearch: true };
    const hotels = [hotel([{id:'rooftop_bar',label:'Rooftop Bar'}]), hotel([])];
    const view = strat.buildView('hotels', plan, hotels);
    expect(view.refinementChips.every(c => !c.count.startsWith('0 '))).toBe(true);
  });
});
```

- [ ] **Step 2: Run; expect failure.**

Run: `npx jest src/app/strategies/concierge.strategy.spec.ts`
Expected: FAIL — `ConciergeStrategy` not found.

- [ ] **Step 3: Implement `ConciergeStrategy`.**

```ts
// src/app/strategies/concierge.strategy.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ISearchStrategy } from './search-strategy.interface';
import { Hotel } from '../models/hotel.model';
import { ConversationState } from '../models/conversation-state.model';
import { TurnPlan, TurnView, HotelResultVM } from '../models/search-strategy.model';
import { AIService } from '../services/ai.service';
import { ClaimService } from '../services/claim.service';
import { MatchService, RefinementCandidate } from '../services/match.service';
import { PricingService } from '../services/pricing.service';

@Injectable({ providedIn: 'root' })
export class ConciergeStrategy implements ISearchStrategy {
  constructor(
    private ai: AIService,
    private claims: ClaimService,
    private match: MatchService,
    private pricing: PricingService,
  ) {}

  planTurn(query: string, state: ConversationState): Observable<TurnPlan> {
    return this.ai.planTurn(query, state);
  }

  buildView(query: string, plan: TurnPlan, hotels: Hotel[]): TurnView {
    const results: HotelResultVM[] = hotels.map(h => {
      const m = this.match.score(h, plan.criteria);
      return {
        hotel: h,
        allInPrimary: this.pricing.formatAllIn(h),
        finePrint: this.pricing.formatFinePrint(h),
        bedType: h.bedType,
        reason: this.claims.whyThisHotel(h, plan.criteria),
        verified: m.reasons,
        misses: m.misses,
        score: m.score,
      };
    });

    const refinementChips = this.match
      .inventoryCounts(hotels, this.candidateRefinements(hotels))
      .slice(0, 4);

    return {
      clarifier: this.buildClarifier(plan, hotels),
      intro: results.length
        ? `Here are ${results.length} stays I can stand behind:`
        : `I couldn't find a match for that — try broadening your search.`,
      results,
      refinementChips,
    };
  }

  /** Build candidate refinements from amenities/vibes actually present in the set. */
  private candidateRefinements(hotels: Hotel[]): RefinementCandidate[] {
    const seen = new Map<string, RefinementCandidate>();
    for (const h of hotels) {
      for (const a of h.verifiedAmenities ?? []) {
        if (!seen.has('a:' + a.id)) seen.set('a:' + a.id, { label: a.label, criterion: { kind: 'amenity', value: a.id } });
      }
      for (const v of h.neighborhood?.vibe ?? []) {
        const key = 'v:' + v.toLowerCase();
        if (!seen.has(key)) seen.set(key, { label: this.cap(v), criterion: { kind: 'vibe', value: v } });
      }
    }
    return Array.from(seen.values());
  }

  /** Grounding guard: only surface the clarifier if the dimension splits inventory. */
  private buildClarifier(plan: TurnPlan, hotels: Hotel[]): TurnView['clarifier'] | undefined {
    if (!plan.needsClarification || !plan.clarifier) return undefined;
    const dim = plan.clarifier.dimension;
    const withDim = hotels.filter(h => (h.verifiedAmenities ?? []).some(a => a.id === dim)).length;
    const varies = withDim > 0 && withDim < hotels.length;
    if (!varies) return undefined; // not grounded → skip, go straight to results
    const label = (hotels.flatMap(h => h.verifiedAmenities).find(a => a.id === dim)?.label) || this.cap(dim);
    return {
      text: `Is a ${label.toLowerCase()} a must-have, or just nice to have?`,
      chips: [
        { label: 'Must-have', value: `must:${dim}` },
        { label: 'Nice-to-have', value: `nice:${dim}` },
      ],
    };
  }

  private cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
}
```

- [ ] **Step 4: Run; expect pass.**

Run: `npx jest src/app/strategies/concierge.strategy.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit.**

```bash
git add src/app/strategies/concierge.strategy.ts src/app/strategies/concierge.strategy.spec.ts
git commit -m "feat: ConciergeStrategy.buildView (all-in/bedType/reason VMs, grounded clarifier, chips)"
```

---

### Task 11: Wire the active strategy into SearchStrategyService

**Files:**
- Modify: `src/app/services/search-strategy.service.ts`
- Modify: `src/app/services/search-strategy.service.spec.ts`

- [ ] **Step 1: Write the failing test.**

```ts
// append to search-strategy.service.spec.ts
import { ConciergeStrategy } from '../strategies/concierge.strategy';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SearchStrategyService.current', () => {
  let service: SearchStrategyService;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SearchStrategyService);
  });
  it('returns the ConciergeStrategy instance by default', () => {
    expect(service.current()).toBeInstanceOf(ConciergeStrategy);
  });
});
```

- [ ] **Step 2: Run; expect failure.**

Run: `npx jest src/app/services/search-strategy.service.spec.ts -t current`
Expected: FAIL — `current` not a function.

- [ ] **Step 3: Add `current()` returning the active strategy object.** Update the service:

```ts
// add imports
import { inject } from '@angular/core';
import { ConciergeStrategy } from '../strategies/concierge.strategy';
import { ISearchStrategy } from '../strategies/search-strategy.interface';
```
```ts
  private concierge = inject(ConciergeStrategy);

  /** Resolve the active strategy object. New strategies register here later. */
  current(): ISearchStrategy {
    switch (this.active) {
      case SearchStrategy.CONCIERGE:
      default:
        return this.concierge;
    }
  }
```

- [ ] **Step 4: Run; expect pass.**

Run: `npx jest src/app/services/search-strategy.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/app/services/search-strategy.service.ts src/app/services/search-strategy.service.spec.ts
git commit -m "feat: SearchStrategyService.current() resolves active strategy object"
```

---

## Phase 5 — UI integration

### Task 12: Hotel card shows all-in, bed type, reason

**Files:**
- Modify: `src/app/components/hotel-card.component.ts` (add optional `vm` input)
- Modify: `src/app/components/hotel-card.component.html`
- Modify: `src/app/components/hotel-card.component.css`

- [ ] **Step 1: Add a `vm` input to the card.** In `hotel-card.component.ts`, add:

```ts
import { HotelResultVM } from '../models/search-strategy.model';
// inside the class, alongside existing @Input()s:
@Input() vm?: HotelResultVM;
```

- [ ] **Step 2: Replace the price block + add bed type/reason in `hotel-card.component.html`.** Replace the existing `.hotel-price` block with:

```html
<div class="hotel-price">
  <div class="price-label">All-in / night</div>
  <div class="price-main">
    {{ vm ? vm.allInPrimary : pricing.formatAllIn(hotel) }}
    <span class="price-currency">total</span>
  </div>
  <div class="price-breakdown">{{ vm ? vm.finePrint : pricing.formatFinePrint(hotel) }}</div>
</div>
<div class="card-meta">
  <span class="bed-type"><i class="ph-fill ph-bed" aria-hidden="true"></i> {{ vm ? vm.bedType : hotel.bedType }}</span>
</div>
<p class="card-reason" *ngIf="vm?.reason">{{ vm?.reason }}</p>
```

- [ ] **Step 3: Add styles in `hotel-card.component.css`.**

```css
.card-meta { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.bed-type { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #374151; }
.card-reason { margin-top: 6px; font-size: 12px; line-height: 1.4; color: #4b5563; }
```

- [ ] **Step 4: Build to verify template compiles.**

Run: `npx ng build --configuration development`
Expected: build succeeds. (The card still works for legacy callers because `vm` is optional and it falls back to `pricing.*(hotel)`.)

- [ ] **Step 5: Commit.**

```bash
git add src/app/components/hotel-card.component.ts src/app/components/hotel-card.component.html src/app/components/hotel-card.component.css
git commit -m "feat: hotel card leads with all-in price, shows bed type + reason"
```

---

### Task 13: clarifier-prompt component

**Files:**
- Create: `src/app/components/clarifier-prompt.component.ts`
- Create: `src/app/components/clarifier-prompt.component.html`
- Create: `src/app/components/clarifier-prompt.component.css`

- [ ] **Step 1: Create the component.**

```ts
// src/app/components/clarifier-prompt.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickReply } from '../models/search-strategy.model';

@Component({
  selector: 'app-clarifier-prompt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clarifier-prompt.component.html',
  styleUrls: ['./clarifier-prompt.component.css'],
})
export class ClarifierPromptComponent {
  @Input() text = '';
  @Input() chips: QuickReply[] = [];
  @Output() chosen = new EventEmitter<QuickReply>();
}
```

- [ ] **Step 2: Create the template (keyboard-navigable buttons).**

```html
<!-- clarifier-prompt.component.html -->
<div class="clarifier" role="group" [attr.aria-label]="text">
  <p class="clarifier-text">{{ text }}</p>
  <div class="clarifier-chips">
    <button *ngFor="let c of chips" type="button" class="clarifier-chip"
            (click)="chosen.emit(c)">{{ c.label }}</button>
  </div>
</div>
```

- [ ] **Step 3: Create styles.**

```css
/* clarifier-prompt.component.css */
.clarifier { background: #eef4f6; border-radius: 12px; padding: 12px 14px; }
.clarifier-text { margin: 0 0 8px; font-size: 14px; color: #1F4456; font-weight: 500; }
.clarifier-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.clarifier-chip { padding: 6px 12px; border: 1px solid #1F4456; background: #fff; color: #1F4456;
  border-radius: 999px; font-size: 13px; cursor: pointer; }
.clarifier-chip:hover { background: #1F4456; color: #fff; }
.clarifier-chip:focus-visible { outline: 2px solid #1F4456; outline-offset: 2px; }
```

- [ ] **Step 4: Build to verify.**

Run: `npx ng build --configuration development`
Expected: succeeds.

- [ ] **Step 5: Commit.**

```bash
git add src/app/components/clarifier-prompt.component.*
git commit -m "feat: clarifier-prompt component (keyboard-navigable quick replies)"
```

---

### Task 14: refinement-chips component

**Files:**
- Create: `src/app/components/refinement-chips.component.ts`
- Create: `src/app/components/refinement-chips.component.html`
- Create: `src/app/components/refinement-chips.component.css`

- [ ] **Step 1: Create the component.**

```ts
// src/app/components/refinement-chips.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RefinementChipVM } from '../services/match.service';

@Component({
  selector: 'app-refinement-chips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './refinement-chips.component.html',
  styleUrls: ['./refinement-chips.component.css'],
})
export class RefinementChipsComponent {
  @Input() chips: RefinementChipVM[] = [];
  @Output() picked = new EventEmitter<RefinementChipVM>();
}
```

- [ ] **Step 2: Create the template (count in accessible name).**

```html
<!-- refinement-chips.component.html -->
<div class="refine-row" role="group" aria-label="Refine results">
  <button *ngFor="let c of chips" type="button" class="refine-chip"
          [attr.aria-label]="c.label + ', ' + c.count + ' results'"
          (click)="picked.emit(c)">
    <span class="refine-label">{{ c.label }}</span>
    <span class="refine-count">{{ c.count }}</span>
  </button>
</div>
```

- [ ] **Step 3: Create styles.**

```css
/* refinement-chips.component.css */
.refine-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.refine-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px;
  border: 1px solid #d1d5db; background: #fff; border-radius: 999px; font-size: 13px; cursor: pointer; }
.refine-chip:hover { border-color: #1F4456; }
.refine-chip:focus-visible { outline: 2px solid #1F4456; outline-offset: 2px; }
.refine-label { color: #111827; font-weight: 500; }
.refine-count { color: #6b7280; font-size: 12px; }
```

- [ ] **Step 4: Build to verify.**

Run: `npx ng build --configuration development`
Expected: succeeds.

- [ ] **Step 5: Commit.**

```bash
git add src/app/components/refinement-chips.component.*
git commit -m "feat: refinement-chips component (live counts, accessible names)"
```

---

### Task 15: Chat renders clarifier, intro, and refinement chips

**Files:**
- Modify: `src/app/components/chat.component.ts`
- Modify: `src/app/components/chat.component.html`

- [ ] **Step 1: Add inputs/outputs + imports to `chat.component.ts`.**

```ts
import { ClarifierPromptComponent } from './clarifier-prompt.component';
import { RefinementChipsComponent } from './refinement-chips.component';
import { QuickReply } from '../models/search-strategy.model';
import { RefinementChipVM } from '../services/match.service';
```
Add both to the component `imports: [...]` array. Add to the class:
```ts
@Output() clarifierChosen = new EventEmitter<QuickReply>();
@Output() refinementPicked = new EventEmitter<RefinementChipVM>();
```
(`Message` already supports `hotels`; the clarifier/chips are carried on the message via new optional fields — add them in Step 2.)

- [ ] **Step 2: Extend the `Message` model.** In `src/app/models/message.model.ts`, add optional fields:

```ts
import { QuickReply, HotelResultVM } from './search-strategy.model';
import { RefinementChipVM } from '../services/match.service';
// inside Message:
  clarifier?: { text: string; chips: QuickReply[] };
  refinementChips?: RefinementChipVM[];
  resultVms?: HotelResultVM[];
```

- [ ] **Step 3: Render them in `chat.component.html`.** Immediately after the AI message bubble (`</div>` closing `.message-bubble`), add:

```html
<!-- Clarifier prompt -->
<app-clarifier-prompt
  *ngIf="message.sender === 'ai' && message.clarifier"
  [text]="message.clarifier.text"
  [chips]="message.clarifier.chips"
  (chosen)="clarifierChosen.emit($event)">
</app-clarifier-prompt>
```
And immediately after the inline hotel cards container, add:
```html
<!-- Refinement chips -->
<app-refinement-chips
  *ngIf="message.sender === 'ai' && message.refinementChips?.length && isLatestHotelMessage(message)"
  [chips]="message.refinementChips!"
  (picked)="refinementPicked.emit($event)">
</app-refinement-chips>
```

- [ ] **Step 4: Build to verify.**

Run: `npx ng build --configuration development`
Expected: succeeds.

- [ ] **Step 5: Commit.**

```bash
git add src/app/components/chat.component.ts src/app/components/chat.component.html src/app/models/message.model.ts
git commit -m "feat: chat renders clarifier prompt + refinement chips from message VM"
```

---

### Task 16: Detail views — Why this hotel + all-in itemization

**Files:**
- Modify: `src/app/components/hotel-detail-drawer.component.html`
- Modify: `src/app/components/hotel-detail-bottom-sheet.component.html`

(The ✓/✗ Amenities section already exists from earlier work; this task adds the "Why this hotel" block and the all-in itemization, reading directly from the bound `hotel`.)

- [ ] **Step 1: Add a "Why this hotel" block.** In BOTH detail templates, immediately above the `<!-- Amenities -->` section, insert:

```html
<!-- Why this hotel -->
<div class="section" *ngIf="hotel.neighborhood">
  <h3 class="section-title">Why this hotel</h3>
  <p class="description-text">
    {{ hotel.bedType }} · {{ hotel.neighborhood.name }}
    <span *ngIf="hotel.neighborhood.vibe?.length"> · {{ hotel.neighborhood.vibe.join(', ') }}</span>
  </p>
  <p class="poi-distance" *ngIf="hotel.walkToDiningMin">{{ hotel.walkToDiningMin }} min walk to dining · Walk score {{ hotel.neighborhood.walkScore }}</p>
</div>
```

- [ ] **Step 2: Add all-in itemization near the booking summary.** In BOTH templates, immediately above the existing `<!-- View Rooms button -->` block, insert:

```html
<!-- All-in itemization -->
<div class="allin-itemization">
  <div class="allin-row"><span>Room (per night)</span><span>${{ hotel.pricing.roomRate }}</span></div>
  <div class="allin-row"><span>Taxes &amp; fees</span><span>${{ hotel.pricing.fees }}</span></div>
  <div class="allin-row allin-total"><span>All-in / night</span><span>${{ hotel.pricing.allInNightly }}</span></div>
</div>
```

- [ ] **Step 3: Add shared styles.** Append to BOTH `hotel-detail-drawer.component.css` and `hotel-detail-bottom-sheet.component.css`:

```css
.allin-itemization { margin: 8px 0 4px; border-top: 1px solid #f3f4f6; padding-top: 8px; }
.allin-row { display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; padding: 3px 0; }
.allin-total { font-weight: 700; color: #111827; border-top: 1px solid #f3f4f6; margin-top: 4px; padding-top: 6px; }
```

- [ ] **Step 4: Build to verify.**

Run: `npx ng build --configuration development`
Expected: succeeds.

- [ ] **Step 5: Commit.**

```bash
git add src/app/components/hotel-detail-drawer.component.* src/app/components/hotel-detail-bottom-sheet.component.*
git commit -m "feat: detail views show Why-this-hotel + all-in itemization"
```

---

### Task 17: Map pin label shows all-in price

**Files:**
- Modify: `src/app/services/map.service.ts` (pin label) — locate the price string used in marker HTML.

- [ ] **Step 1: Find the current pin price.**

Run: `grep -n "nightlyRate\|formatRate\|price" src/app/services/map.service.ts`
Expected: a line composing the marker label from a nightly rate.

- [ ] **Step 2: Replace it with all-in.** Inject `PricingService` into `MapService` if not already, then change the marker price expression to use `this.pricing.allInNightly(hotel)` rendered as `$<n>`. Concretely, where the label currently interpolates the rate, replace with:

```ts
// where the marker label price is built:
const priceLabel = `$${this.pricing.allInNightly(hotel)}`;
```
And ensure the constructor has `private pricing: PricingService` and the import `import { PricingService } from './pricing.service';`.

- [ ] **Step 3: Build to verify.**

Run: `npx ng build --configuration development`
Expected: succeeds.

- [ ] **Step 4: Commit.**

```bash
git add src/app/services/map.service.ts
git commit -m "feat: map pins show all-in price"
```

---

### Task 18: Wire the turn flow through SearchStrategyService

**Files:**
- Modify: `src/app/app.component.ts`

This routes user messages through the active strategy: plan → search → buildView → attach VM to the AI message.

- [ ] **Step 1: Add imports + inject the strategy service.** In `app.component.ts`:

```ts
import { SearchStrategyService } from './services/search-strategy.service';
import { QuickReply, TurnPlan, TurnView } from './models/search-strategy.model';
import { RefinementChipVM } from './services/match.service';
```
Add `private strategyService: SearchStrategyService` to the constructor parameters.

- [ ] **Step 2: Add a strategy-driven send path.** Add this method to the class:

```ts
  /** CONCIERGE turn flow: plan → (clarify | search) → buildView → render. */
  private runStrategyTurn(message: string): void {
    const strategy = this.strategyService.current();
    this.isThinking = true;
    this.inputDisabled = true;
    this.conversationService.getState().pipe(take(1)).subscribe(state => {
      strategy.planTurn(message, state).pipe(take(1)).subscribe((plan: TurnPlan) => {
        // Filter hotels with existing criteria→hotel pipeline
        const hotels = plan.criteria && Object.keys(plan.criteria).length
          ? this.hotelService.filterHotels(this.allHotels, plan.criteria)
          : this.allHotels;
        const view: TurnView = strategy.buildView(message, plan, hotels);

        this.currentHotels = view.results.map(r => r.hotel);

        const aiMessage: Message = {
          id: this.generateMessageId(),
          sender: 'ai',
          text: view.intro,
          timestamp: new Date(),
          hotels: view.results.length ? view.results.map(r => r.hotel) : undefined,
          resultVms: view.results,
          clarifier: view.clarifier,
          refinementChips: view.refinementChips,
        };
        this.conversationService.addMessage(aiMessage);
        this.isThinking = false;
        this.inputDisabled = false;
      });
    });
  }
```

- [ ] **Step 3: Route `onMessageSent` through the strategy.** Replace the body of `onMessageSent(message: string)` so it adds the user message then calls `runStrategyTurn`:

```ts
  onMessageSent(message: string): void {
    if (this.currentAIRequest$) { this.currentAIRequest$.unsubscribe(); this.currentAIRequest$ = null; }
    const userMessage: Message = {
      id: this.generateMessageId(), sender: 'user', text: message, timestamp: new Date(),
    };
    this.conversationService.addMessage(userMessage);
    this.runStrategyTurn(message);
  }
```

- [ ] **Step 4: Handle clarifier + refinement events.** Add handlers and wire them in the template bindings for both layouts (`(clarifierChosen)` and `(refinementPicked)` pass through chat → layout → app):

```ts
  onClarifierChosen(reply: QuickReply): void {
    // "must:rooftop_bar" | "nice:rooftop_bar" → treat as an added amenity criterion
    const [, dim] = reply.value.split(':');
    this.onMessageSent(`I'd like a hotel with ${dim.replace(/_/g, ' ')}`);
  }

  onRefinementPicked(chip: RefinementChipVM): void {
    this.onMessageSent(`Show me the ones with ${chip.label.toLowerCase()}`);
  }
```
Then add to the chat usages inside `desktop-layout` and `mobile-layout` templates (and forward through their `@Output()`s exactly like the existing `messageSent` is forwarded): `(clarifierChosen)="clarifierChosen.emit($event)"` and `(refinementPicked)="refinementPicked.emit($event)"` on `<app-chat>`, the matching `@Output()`s on each layout component, and on `<app-desktop-layout>`/`<app-mobile-layout>` in `app.component.ts`: `(clarifierChosen)="onClarifierChosen($event)"` and `(refinementPicked)="onRefinementPicked($event)"`.

- [ ] **Step 5: Pass the result VM to inline cards.** In `chat.component.html`, on the inline `<app-hotel-card>`, add `[vm]="getVmFor(message, hotel)"`; add this helper to `chat.component.ts`:

```ts
  getVmFor(message: Message, hotel: Hotel) {
    return message.resultVms?.find(v => v.hotel.id === hotel.id);
  }
```

- [ ] **Step 6: Build + run the full suite.**

Run: `npx ng build --configuration development && npx jest`
Expected: build succeeds; all specs pass.

- [ ] **Step 7: Commit.**

```bash
git add src/app/app.component.ts src/app/components/chat.component.* \
  src/app/components/desktop-layout.component.* src/app/components/mobile-layout.component.*
git commit -m "feat: route messages through SearchStrategyService (CONCIERGE turn flow)"
```

---

## Phase 6 — Verification

### Task 19: Hallucination guarantee — integration test

**Files:**
- Create: `src/app/strategies/concierge.hallucination.spec.ts`

- [ ] **Step 1: Write the test that a hallucinated plan can't surface a fake amenity.**

```ts
// src/app/strategies/concierge.hallucination.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConciergeStrategy } from './concierge.strategy';
import { ClaimService } from '../services/claim.service';
import { MatchService } from '../services/match.service';
import { PricingService } from '../services/pricing.service';
import { AIService } from '../services/ai.service';
import { Hotel } from '../models/hotel.model';
import { TurnPlan } from '../models/search-strategy.model';

function hotel(): Hotel {
  return {
    id: 'x', name: 'voco H', brand: 'voco', rating: 4,
    location: { address: '', neighborhood: 'Theater District', coordinates: { lat: 0, lng: 0 } },
    pricing: { nightlyRate: 300, roomRate: 300, fees: 60, allInNightly: 360 },
    amenities: [], bedType: '1 King',
    verifiedAmenities: [{ id: 'free_wifi', label: 'Free Wi-Fi' }],
    missingAmenities: [{ id: 'pool', label: 'Pool' }],
    neighborhood: { name: 'Theater District', vibe: ['lively'], walkScore: 98, nearby: [] },
    pointsEarned: 0, walkToDiningMin: 2,
    description: '', imageUrls: [], phone: '', sentiment: [],
  };
}

describe('CONCIERGE hallucination guarantee', () => {
  let strat: ConciergeStrategy;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConciergeStrategy, ClaimService, MatchService, PricingService, AIService],
    });
    strat = TestBed.inject(ConciergeStrategy);
  });

  it('a plan requesting an unverified amenity never renders it as a verified fact', () => {
    // The "model" asked for a rooftop bar + pool the hotel does NOT verify.
    const plan: TurnPlan = { intent: 'complete_query', criteria: { amenities: ['rooftop_bar', 'pool'] }, needsClarification: false, shouldSearch: true };
    const view = strat.buildView('rooftop and pool', plan, [hotel()]);
    const vm = view.results[0];
    // verified list contains ONLY the truly-verified amenity
    expect(vm.verified.map(v => v.id)).toEqual([]); // neither requested amenity is verified
    expect(vm.misses.map(m => m.id).sort()).toEqual(['pool', 'rooftop_bar']);
    // the reason text never names a missing amenity
    expect(vm.reason).not.toContain('Pool');
    expect(vm.reason).not.toContain('Rooftop');
  });
});
```

- [ ] **Step 2: Run; expect pass (the firewall already guarantees this).**

Run: `npx jest src/app/strategies/concierge.hallucination.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/app/strategies/concierge.hallucination.spec.ts
git commit -m "test: CONCIERGE never surfaces an unverified amenity as a fact"
```

---

### Task 20: Strategy-swap test + final verification

**Files:**
- Modify: `src/app/services/search-strategy.service.spec.ts`

- [ ] **Step 1: Add a swap test proving the flag changes the active object without component changes.**

```ts
// append to search-strategy.service.spec.ts
import { SearchStrategy } from '../models/search-strategy.model';

describe('SearchStrategyService swap', () => {
  let service: SearchStrategyService;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SearchStrategyService);
  });
  it('current() always returns a strategy implementing planTurn/buildView', () => {
    const s = service.current();
    expect(typeof s.planTurn).toBe('function');
    expect(typeof s.buildView).toBe('function');
  });
  it('switching the flag does not throw (future strategies fall back to concierge)', () => {
    service.setStrategy(SearchStrategy.COMPARE);
    expect(() => service.current()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the full suite + production build.**

Run: `npx jest && npx ng build --configuration development`
Expected: all specs pass; build succeeds.

- [ ] **Step 3: Manual smoke test (dev server already on :4201).**

Verify by hand against acceptance criteria:
- Search "romantic hotel with a rooftop bar" → all-in price is the big number on every card; bed type + reason show; refinement chips show "N of 6" and none say "0 of".
- If the query is ambiguous, exactly one clarifier appears before results; answering it re-runs the search.
- Open a hotel → "Why this hotel" + ✓/✗ amenities + all-in itemization (room + taxes/fees = all-in).
- Map pins show `$<all-in>`.

- [ ] **Step 4: Final commit.**

```bash
git add -A
git commit -m "test: strategy-swap coverage; final foundation + CONCIERGE verification"
```

---

## Self-Review Notes (author)

- **Spec coverage:** All-in (Tasks 3,4,12,16,17), verified-only claims (Tasks 5,19), bed type + reason on cards (Task 12), strategy flag no-fork (Tasks 1,11,20), CONCIERGE clarifier-when-ambiguous + grounded (Tasks 8,10), refinement chips live counts no-dead-end (Tasks 7,10,14,15), data contract (Tasks 2,3), accessibility (Tasks 13,14). All acceptance criteria mapped.
- **Type consistency:** `RefinementChipVM`/`Criterion`/`RefinementCandidate` defined in Task 7 (match.service) and consumed in Tasks 9,10,14,15,18. `TurnPlan`/`TurnView`/`HotelResultVM`/`QuickReply` defined in Tasks 8,9 (search-strategy.model) and consumed downstream. `formatAllIn`/`formatFinePrint`/`allInNightly` defined in Task 4 and used in Tasks 10,12,17.
- **Note for executor:** if existing component/spec `Hotel` literals fail to compile after Task 2, add the new required fields (per Task 3 Step 6) to those literals — this is expected fan-out from a required-field model change.
