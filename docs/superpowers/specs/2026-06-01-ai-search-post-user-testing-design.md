# IHG AI Hotel Search — Post User Testing Design Spec
**Date:** 2026-06-01  
**Branch:** post-user-testing  
**Audience:** Stakeholder / leadership review  
**Scope:** Design-first (no code changes yet)

---

## Context

User testing on the IHG AI Hotel Search prototype revealed one dominant problem: **users couldn't articulate why they would use AI search over the standard form.** Value was not communicated before the user clicked in, the AI didn't demonstrate its intelligence through the conversation, hotel cards felt generic rather than curated, and the hand-off to the booking page felt jarring.

This spec addresses four improvement areas, anchored by a single narrative: *describe your trip in your own words, and an AI that knows IHG's properties deeply will find the right fit for you.*

Note: AI trust/transparency issues (amenity suggestions not matching inventory, price inaccuracies) are being addressed separately in the live product and are out of scope here.

---

## Core Value Proposition

> "Describe your trip in your own words — our AI knows IHG's NYC properties and will match you to the right hotel."

This positions the feature as a mix of **vibe-first search** (natural language, occasion-driven) and **concierge intelligence** (deep IHG property knowledge, proactive recommendations). It is most valuable for occasion-driven travelers (family trips, romantic weekends, special events) and first-time NYC visitors who don't know exactly what they want.

---

## Section 1 — Entry Point Redesign

### Problem
The "AI Search Beta" label communicates nothing. Users who didn't already understand AI chatbots skipped it or dismissed it before engaging.

### Design Direction: Show Before You Ask

Replace the current text-only entry bar with an **inline example teaser** that demonstrates a real AI conversation snippet — so the value is shown, not described.

**Entry bar components:**
- IHG AI Search label + Beta badge (retained)
- A miniature example exchange embedded in the bar:
  - User message: *"Family of 4, close to Times Square, somewhere the kids will love"*
  - AI response: *"Found 3 great matches — Holiday Inn Times Square has kids eat free 🎉"*
- Single clear CTA: **"Describe your trip →"**

**Design rules:**
- Example exchange must use real, plausible content — not placeholder copy
- Example should rotate or be curated to reflect the most common occasions (family, romantic, business)
- The bar should feel premium and intentional, not like a secondary feature
- Occasion chips (Family trip, Romantic weekend, Business stay, Special occasion) are moved **inside** the AI chat as the opening prompt — not on the homepage bar

---

## Section 2 — Smarter AI Conversation

### Problem
The AI surfaced results immediately after the first message with no follow-up, making it feel like a filter wrapper rather than a knowledgeable concierge. It also suggested amenities (rooftop bar, fitness center) that the returned hotels didn't have.

### Design Direction: One Smart Follow-Up

**Opening state — occasion chips:**
Replace the current generic suggested prompts ("Romantic weekend in New York", "Hotels under $300") with occasion-first chips:
- 🧳 Family trip
- 💑 Romantic weekend  
- 💼 Business stay
- ✨ Special occasion
- Free-text input remains available

**After the user's first message:**
The AI asks exactly **one** targeted clarifying question before showing results. The question must:
1. Be specific to the occasion detected in the user's message
2. Demonstrate IHG property knowledge (e.g. mentioning kids-eat-free, family suites, proximity to landmarks)
3. Include **3–4 tappable quick reply chips** so mobile users don't have to type
4. Always include a **"Skip"** chip — the user is never forced to answer

**Example (family trip):**
> "Love it — Times Square puts you right in the action! 🗽
> One quick question: are the kids at a specific age? Some of our hotels have kids-eat-free dining and family suites which could be perfect."
> → [Under 10] [Teens] [Mixed ages] [Skip]

**Design rules:**
- Maximum one follow-up question per conversation turn
- If the user skips, proceed gracefully to results without re-asking
- The AI's tone is warm and knowledgeable — not robotic or transactional
- A scope note appears inline after the follow-up question: *"ℹ️ I'll find your match — you'll book directly on the hotel's secure page"*

---

## Section 3 — Personalized Hotel Cards

### Problem
Hotel cards showed generic amenity chips with no explanation of why a hotel was recommended for the user's specific request. No ratings or review count were visible. When nothing perfectly matched, nothing was shown.

### Design Direction: Match Score + Curated Reasons

**Best match card (90–100% match):**
- **Match badge** (blue): "✦ Top pick for your family" — occasion-specific label
- **% match score**: "98% match" displayed prominently in the badge
- **"Why this fits" callout** (green): One-line reason tied to what the user asked for (e.g. *"Kids eat free at the on-site restaurant, family suites available, steps from the TKTS booth"*)
- **Occasion-relevant amenity chips**: Surface the most relevant amenity first (e.g. 🍽 Kids eat free), not default to WiFi/fitness
- Existing star rating and pricing treatment retained (no duplication)

**Near-match card (60–89% match):**
- **Match badge** (amber): "◐ Close match" 
- **% match score**: e.g. "74% match" in amber
- **"What's missing" callout** (amber): One-line explanation of the gap (e.g. *"No kids-eat-free dining — but highly rated for families and close to Times Square"*)
- Same amenity chip and pricing treatment

**Match score thresholds:**
| Score | Treatment |
|---|---|
| 90–100% | Blue "Best match" badge |
| 60–89% | Amber "Close match" badge + "What's missing" |
| Below 60% | Not shown — AI explains if no matches meet threshold |

**Design rules:**
- "Why this fits" and "What's missing" copy must reference the user's actual stated preferences — not generic hotel descriptions
- Occasion-relevant amenities always surface first in the chip list
- Near-match cards always appear below best-match cards, never above

---

## Section 4 — Booking Hand-Off

### Problem
Clicking "View rooms" opened a new tab on the hotel's booking site without warning, breaking the sense of continuity after a smooth AI conversation.

### Design Direction: Intentional Two-Part Hand-Off

**Fix 1 — Set scope early (in AI conversation):**
A subtle inline note appears at the bottom of the AI's first response:
> *ℹ️ I'll find your match — you'll book directly on the hotel's secure page*

This sets expectations before the user has invested deeply in the conversation — not as a warning at the point of departure.

**Fix 2 — Intentional hand-off moment:**
When the user clicks "View rooms," instead of immediately opening a new tab, a **hand-off confirmation card** appears:

- Hotel name + "IHG secure booking page" subtitle
- Summary of what's being carried over:
  - ✓ Guest count (e.g. Family of 4 · 2 adults, 2 children)
  - ✓ Dates (e.g. Jul 15 → Jul 22)
- Two actions:
  - **"Continue to booking →"** (primary) — opens the hotel booking page
  - **"Stay here"** (secondary) — dismisses the card and returns to results

**Design rules:**
- The hand-off card is a lightweight overlay — not a full modal or page transition
- "Stay here" always available — users are never forced out of the AI experience
- The carried-over details must match what the user actually entered, not generic placeholders
- This design is intentionally lightweight to allow future evolution toward in-context booking

---

## What's Not in Scope

- AI trust/transparency fixes (amenity-suggestion logic, price accuracy) — being addressed in the live product
- In-context booking (full booking flow within the AI) — flagged as a future roadmap direction
- Geography expansion beyond Manhattan — prototype constraint, not a design issue

---

## Verification

This is a design spec for stakeholder review — no code yet. To validate:

1. **Stakeholder review:** Walk through sections 1–4 in order. Each section has a clear "before" state grounded in user research and a proposed direction with rationale.
2. **Next round of user testing:** Once built into the prototype, re-test specifically on:
   - Do users understand what the AI does before clicking in? (Entry point)
   - Does the one follow-up question feel helpful or intrusive? (AI conversation)
   - Does the % match score help users compare options? (Hotel cards)
   - Does the hand-off confirmation reduce surprise? (Booking hand-off)
3. **Stakeholder open questions to resolve before implementation:**
   - What is the algorithm / criteria for the % match score?
   - Who owns the "Why this fits" copy — AI-generated or editorial?
   - Is in-context booking on the product roadmap, and on what timeline?
