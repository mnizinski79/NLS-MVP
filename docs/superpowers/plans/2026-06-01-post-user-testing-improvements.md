# Post User Testing Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement five UX improvements to the IHG AI Hotel Search prototype based on user testing findings, using the `claude` branch as the base.

**Architecture:** Merge `claude` branch (which has match scoring + persistent filter chips) then layer on: (1) landing page example teaser + occasion chips, (2) AI-returned suggested reply chips + first-response scope note, (3) hotel card match reason callouts + near-match amber treatment, and (4) booking hand-off confirmation overlay.

**Tech Stack:** Angular 17 standalone components, Tailwind-adjacent CSS, Gemini 2.5 Flash via REST (ai.service.ts), RxJS BehaviorSubject state management.

---

## File Map

| File | Change |
|---|---|
| `src/app/models/hotel.model.ts` | Add `matchReason?: string`, `matchType?: 'best' \| 'near'` |
| `src/app/models/ai-response.model.ts` | Add `suggestedReplies?: string[]` |
| `src/app/models/message.model.ts` | Add `suggestedReplies?: string[]` |
| `src/app/services/hotel.service.ts` | Add `generateMatchReason()`, call it in `computeMatchScores()` |
| `src/app/services/ai.service.ts` | Update `buildPrompt()` JSON schema + instructions for scope note + suggestedReplies |
| `src/app/app.component.ts` | Map `suggestedReplies` from `AIResponse` → `Message`; add `isFirstAiResponse` tracking |
| `src/app/components/landing.component.ts` | Replace `searchChips` with occasion chips; add `exampleTeaser` data |
| `src/app/components/landing.component.html` | Add example teaser above chips (desktop + mobile) |
| `src/app/components/landing.component.css` | Styles for example teaser |
| `src/app/components/chat.component.html` | Render `suggestedReplies` as tappable chips below AI messages |
| `src/app/components/chat.component.ts` | Add `@Output() replyChipClicked` emitter |
| `src/app/components/desktop-layout.component.html` | Wire `replyChipClicked` → `onTagClicked` |
| `src/app/components/mobile-layout.component.html` | Wire `replyChipClicked` → `onTagClicked` |
| `src/app/components/hotel-card.component.html` | Add match reason callout + `match-near` class |
| `src/app/components/hotel-card.component.css` | Amber near-match badge + green reason callout styles |
| `src/app/components/hotel-detail-drawer.component.html` | Add hand-off overlay |
| `src/app/components/hotel-detail-drawer.component.ts` | Add `showHandoff` flag, update `viewRooms()` |
| `src/app/components/hotel-detail-bottom-sheet.component.html` | Add hand-off overlay |
| `src/app/components/hotel-detail-bottom-sheet.component.ts` | Add `showHandoff` flag, update `viewRooms()` |

---

## Task 1: Merge claude branch

**Files:** git only

- [ ] **Step 1: Verify current branch**

```bash
git branch
```
Expected: `* post-user-testing`

- [ ] **Step 2: Merge claude branch**

```bash
git merge claude --no-edit
```
Expected: merge commit created, no conflicts (both branches diverged from same base).
If there are conflicts, resolve in favour of `claude` branch for any model/service files, and in favour of `post-user-testing` for `docs/` files.

- [ ] **Step 3: Verify app builds**

```bash
cd /Users/uctsng/Desktop/Kiro/NLS-MVP && npm run build 2>&1 | tail -20
```
Expected: `Build at:` success line. Fix any TypeScript errors before continuing.

- [ ] **Step 4: Commit merge**

```bash
git add -A && git commit -m "Merge claude branch — adds match scoring and filter chips"
```

---

## Task 2: Hotel model — add matchReason and matchType

**Files:**
- Modify: `src/app/models/hotel.model.ts`

- [ ] **Step 1: Add fields to Hotel interface**

Open `src/app/models/hotel.model.ts`. After the `matchContext` field, add:

```typescript
  matchReason?: string;   // "Why this fits" or "What's missing" copy
  matchType?: 'best' | 'near';  // controls card badge colour
```

The full bottom of the interface should look like:

```typescript
  matchScore?: number;
  matchContext?: {
    amenities: string[];
    brands: string[];
    priceRange: { min?: number; max?: number } | null;
    minRating: number | null;
    sentiments: string[];
  };
  matchReason?: string;
  matchType?: 'best' | 'near';
}
```

- [ ] **Step 2: Verify build still passes**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | head -10
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/models/hotel.model.ts
git commit -m "feat: add matchReason and matchType to Hotel model"
```

---

## Task 3: Hotel service — generate match reason copy

**Files:**
- Modify: `src/app/services/hotel.service.ts`

The `computeMatchScores()` method already computes `matchScore` (75–99) and `matchContext`. We need to also compute `matchReason` and `matchType` based on the score and context.

- [ ] **Step 1: Add generateMatchReason private method**

Find the closing `}` of `computeMatchScores()` (currently the last method before the class closing brace). Add this new private method after it:

```typescript
  /**
   * Generates human-readable match reason copy for hotel cards.
   * "Why this fits" for best matches, "What's missing" for near-matches.
   */
  private generateMatchReason(
    hotel: Hotel,
    context: NonNullable<Hotel['matchContext']>,
    score: number
  ): { reason: string; type: 'best' | 'near' } {
    const type: 'best' | 'near' = score >= 90 ? 'best' : 'near';

    if (type === 'best') {
      const highlights: string[] = [];

      // Matched amenities (up to 2)
      const matchedAmenities = context.amenities
        .filter(a => hotel.amenities.some(ha => ha.toLowerCase() === a.toLowerCase()))
        .slice(0, 2);
      if (matchedAmenities.length > 0) {
        highlights.push(matchedAmenities.join(' & ') + ' available');
      }

      // Location match
      const matchedSentiments = context.sentiments
        .filter(s => hotel.sentiment.some(hs => hs.toLowerCase() === s.toLowerCase()))
        .slice(0, 1);
      if (matchedSentiments.length > 0) {
        highlights.push(`located in ${matchedSentiments[0]}`);
      }

      // Price match callout
      if (context.priceRange?.max && hotel.pricing.nightlyRate <= context.priceRange.max) {
        highlights.push(`within your $${context.priceRange.max}/night budget`);
      }

      // Rating match
      if (context.minRating && hotel.rating >= context.minRating) {
        highlights.push(`${hotel.rating}-star rated`);
      }

      const reason = highlights.length > 0
        ? highlights.join(', ')
        : `matches your search criteria`;
      return { reason: reason.charAt(0).toUpperCase() + reason.slice(1), type };
    } else {
      // Near-match: surface what's missing
      const missing: string[] = [];

      const missingAmenities = context.amenities
        .filter(a => !hotel.amenities.some(ha => ha.toLowerCase() === a.toLowerCase()))
        .slice(0, 2);
      if (missingAmenities.length > 0) {
        missing.push(`no ${missingAmenities.join(' or ')}`);
      }

      if (context.minRating && hotel.rating < context.minRating) {
        missing.push(`rated ${hotel.rating}/5 (below your ${context.minRating}★ preference)`);
      }

      if (context.priceRange?.max && hotel.pricing.nightlyRate > context.priceRange.max) {
        const over = Math.round(hotel.pricing.nightlyRate - context.priceRange.max);
        missing.push(`$${over} over your budget`);
      }

      const reason = missing.length > 0
        ? `Missing: ${missing.join(', ')}`
        : `Partially matches your criteria`;
      return { reason, type };
    }
  }
```

- [ ] **Step 2: Call generateMatchReason inside computeMatchScores**

In `computeMatchScores()`, find the return statement inside the `map()` callback:

```typescript
      return { ...hotel, matchScore, matchContext };
```

Replace it with:

```typescript
      const { reason: matchReason, type: matchType } = this.generateMatchReason(hotel, matchContext, matchScore);
      return { ...hotel, matchScore, matchContext, matchReason, matchType };
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | head -10
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/services/hotel.service.ts
git commit -m "feat: generate match reason and matchType in hotel service"
```

---

## Task 4: Hotel card — render match reason + near-match amber styling

**Files:**
- Modify: `src/app/components/hotel-card.component.html`
- Modify: `src/app/components/hotel-card.component.css`

- [ ] **Step 1: Update hotel-card.component.html**

Find the existing match badge block:

```html
    <!-- Match Score Badge (Bottom Left) -->
    <div *ngIf="hotel.matchScore" class="match-badge" [attr.aria-label]="hotel.matchScore + '% match for your search'">
      {{ hotel.matchScore }}% match
    </div>
```

Replace it with:

```html
    <!-- Match Score Badge (Bottom Left) — colour driven by matchType -->
    <div
      *ngIf="hotel.matchScore"
      class="match-badge"
      [class.match-badge-near]="hotel.matchType === 'near'"
      [attr.aria-label]="hotel.matchScore + '% match for your search'"
    >
      {{ hotel.matchScore }}% match
    </div>
```

Then find the hotel content section, just after `<div class="hotel-card-content">` and before `<h3 class="hotel-name">`. Add the reason callout:

```html
    <!-- Match reason callout — "Why this fits" or "What's missing" -->
    <div
      *ngIf="hotel.matchReason"
      class="match-reason"
      [class.match-reason-near]="hotel.matchType === 'near'"
      [attr.aria-label]="hotel.matchType === 'best' ? 'Why this hotel fits: ' + hotel.matchReason : hotel.matchReason"
    >
      <span class="match-reason-icon" aria-hidden="true">{{ hotel.matchType === 'best' ? '🎯' : '⚠' }}</span>
      <span class="match-reason-text">{{ hotel.matchReason }}</span>
    </div>
```

- [ ] **Step 2: Add CSS for amber near-match and reason callout**

Open `src/app/components/hotel-card.component.css`. Add at the end:

```css
/* ── Near-match amber badge ─────────────────────── */
.match-badge-near {
  background: #854d0e;
  color: #fef9c3;
}

/* ── Match reason callout ───────────────────────── */
.match-reason {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 6px 8px;
  margin-bottom: 8px;
  font-size: 11px;
  line-height: 1.4;
  color: #166534;
}

.match-reason-near {
  background: #fef9c3;
  border-color: #fde68a;
  color: #854d0e;
}

.match-reason-icon {
  flex-shrink: 0;
  font-size: 12px;
  margin-top: 1px;
}

.match-reason-text {
  flex: 1;
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | head -10
```

- [ ] **Step 4: Commit**

```bash
git add src/app/components/hotel-card.component.html src/app/components/hotel-card.component.css
git commit -m "feat: add match reason callout and near-match amber treatment to hotel card"
```

---

## Task 5: AI response model — add suggestedReplies

**Files:**
- Modify: `src/app/models/ai-response.model.ts`
- Modify: `src/app/models/message.model.ts`

- [ ] **Step 1: Add suggestedReplies to AIResponse**

Open `src/app/models/ai-response.model.ts`. Add before the closing `}`:

```typescript
  /** Short reply options shown as tappable chips below the AI message */
  suggestedReplies?: string[];
```

- [ ] **Step 2: Add suggestedReplies to Message**

Open `src/app/models/message.model.ts`. Add before the closing `}`:

```typescript
  /** Tappable reply chip labels shown below this AI message */
  suggestedReplies?: string[];
```

- [ ] **Step 3: Commit**

```bash
git add src/app/models/ai-response.model.ts src/app/models/message.model.ts
git commit -m "feat: add suggestedReplies to AIResponse and Message models"
```

---

## Task 6: AI service — scope note + suggestedReplies in prompt

**Files:**
- Modify: `src/app/services/ai.service.ts`

Two changes: (1) instruct Gemini to return `suggestedReplies` when asking a clarifying question, and (2) instruct it to append a scope note on the first turn.

- [ ] **Step 1: Add suggestedReplies to JSON schema in buildPrompt**

In `ai.service.ts`, find the JSON schema block (around line 440) that defines the expected response. Locate where `searchSummary` is defined and add `suggestedReplies` after it:

```
"suggestedReplies": ["Under 10", "Teens", "Mixed ages", "Skip"] or [] if no clarifying question
```

Find the comment or line that describes `searchSummary` in the prompt's schema description and append:

```
"suggestedReplies": string[] — REQUIRED when asking a clarifying question. Provide 3-4 short tappable reply options (max 4 words each) that directly answer your question. Always include "Skip" as the last option. Return [] when showing results directly.
```

- [ ] **Step 2: Add instruction for scope note on first turn**

In `buildPrompt()`, in the system instructions section (around lines 158-299), add a new instruction block. Find the section that discusses personality or response length and add after it:

```
SCOPE NOTE (first turn only): If this is the first message in the conversation (turnCount === 1 or no previous query), append this exact sentence at the end of your message, on a new line, in a smaller note style: "ℹ️ I'll find your match — you'll complete booking on the hotel's secure page."

CLARIFYING QUESTIONS: When a user's query is vague (no location, no dates, no strong preference signal), ask exactly ONE targeted follow-up question before showing results. The question must:
- Reference a specific IHG property feature (e.g., kids-eat-free dining, family suites, rooftop bar)
- Be phrased warmly (not interrogative)
- Be accompanied by suggestedReplies chips
Never ask more than one follow-up question per turn. If the user uses a chip reply or says "skip", proceed to results immediately.
```

- [ ] **Step 3: Add suggestedReplies to JSON schema object**

Find the section in `buildPrompt()` where the JSON response schema is defined as a string (the block with `intent`, `message`, `searchCriteria`, etc.). Add `suggestedReplies` to this schema:

```
"suggestedReplies": [] 
```

Add it after `searchSummary` in the schema object. The full addition:

```
"suggestedReplies": string[] (3-4 short chip labels when asking a question, always include "Skip", otherwise [])
```

- [ ] **Step 4: Update parseResponse to extract suggestedReplies**

In `ai.service.ts`, find `parseResponse()`. After the line that reads `searchSummary` from the parsed JSON (or near the end of the parsed object construction), add:

```typescript
suggestedReplies: Array.isArray(parsed.suggestedReplies) 
  ? (parsed.suggestedReplies as string[]).slice(0, 4) 
  : [],
```

This ensures the field is always an array and capped at 4 items.

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | head -10
```

- [ ] **Step 6: Commit**

```bash
git add src/app/services/ai.service.ts
git commit -m "feat: add suggestedReplies and scope note to AI prompt and response parsing"
```

---

## Task 7: App component — pass suggestedReplies to Message

**Files:**
- Modify: `src/app/app.component.ts`

- [ ] **Step 1: Map suggestedReplies from AIResponse to Message**

In `app.component.ts`, find where an AI `Message` object is constructed after a Gemini response (look for `sender: 'ai'` construction). Add `suggestedReplies` to the object:

```typescript
suggestedReplies: aiResponse.suggestedReplies ?? [],
```

There may be multiple places where AI messages are constructed (e.g., for hotel results, for refinements). Add this field to every AI message construction block.

- [ ] **Step 2: Clear suggestedReplies on subsequent messages**

When the user sends a new message, any previous AI message's chips should be cleared (they're stale). In `onMessageSent()` or wherever messages are updated, add logic to clear `suggestedReplies` from the last AI message when a new user message arrives:

```typescript
// Clear suggestedReplies from last AI message (they're now stale)
const msgs = this.conversationService.getCurrentMessages();
const lastAi = [...msgs].reverse().find(m => m.sender === 'ai');
if (lastAi) {
  lastAi.suggestedReplies = [];
}
```

Note: Check how `conversationService` exposes current messages — there may be a synchronous getter (`getMessages()` snapshot or similar). Use whatever pattern already exists.

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | head -10
```

- [ ] **Step 4: Commit**

```bash
git add src/app/app.component.ts
git commit -m "feat: pass suggestedReplies from AI response into chat messages"
```

---

## Task 8: Chat component — render reply chips

**Files:**
- Modify: `src/app/components/chat.component.html`
- Modify: `src/app/components/chat.component.ts`
- Modify: `src/app/components/chat.component.css`

- [ ] **Step 1: Add replyChipClicked output to chat.component.ts**

Open `src/app/components/chat.component.ts`. Add a new `@Output()`:

```typescript
@Output() replyChipClicked = new EventEmitter<string>();
```

Add a handler method:

```typescript
onReplyChipClick(reply: string): void {
  this.replyChipClicked.emit(reply);
}
```

- [ ] **Step 2: Render chips in chat.component.html**

In `chat.component.html`, find the block that renders an AI message (look for `sender === 'ai'` or the AI message div). After the message text and any hotel cards, add the reply chips:

```html
<!-- Suggested reply chips (tappable, only on last AI message with replies) -->
<div
  *ngIf="message.suggestedReplies && message.suggestedReplies.length > 0"
  class="reply-chips"
  role="list"
  aria-label="Quick reply options"
>
  <button
    *ngFor="let reply of message.suggestedReplies"
    type="button"
    class="reply-chip"
    role="listitem"
    (click)="onReplyChipClick(reply)"
  >
    {{ reply }}
  </button>
</div>
```

- [ ] **Step 3: Add chip styles to chat.component.css**

```css
/* ── Reply chips ────────────────────────────────── */
.reply-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.reply-chip {
  background: #ffffff;
  border: 1.5px solid #1F4456;
  color: #1F4456;
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: inherit;
}

.reply-chip:hover,
.reply-chip:focus {
  background: #1F4456;
  color: #ffffff;
  outline: none;
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | head -10
```

- [ ] **Step 5: Commit**

```bash
git add src/app/components/chat.component.html src/app/components/chat.component.ts src/app/components/chat.component.css
git commit -m "feat: render AI suggested reply chips in chat"
```

---

## Task 9: Wire reply chips in layout components

**Files:**
- Modify: `src/app/components/desktop-layout.component.html`
- Modify: `src/app/components/mobile-layout.component.html`

- [ ] **Step 1: Desktop layout — wire replyChipClicked**

In `desktop-layout.component.html`, find the `<app-chat>` element. Add the event binding:

```html
(replyChipClicked)="onTagClicked($event)"
```

The `onTagClicked` handler already exists (it processes suggested prompt clicks from helper-tags). Reply chips submit as new user queries, so reusing this handler is correct.

- [ ] **Step 2: Mobile layout — wire replyChipClicked**

In `mobile-layout.component.html`, find the `<app-chat>` element. Add the same binding:

```html
(replyChipClicked)="onTagClicked($event)"
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | head -10
```

- [ ] **Step 4: Commit**

```bash
git add src/app/components/desktop-layout.component.html src/app/components/mobile-layout.component.html
git commit -m "feat: wire reply chip clicks through to tag handler in layouts"
```

---

## Task 10: Landing — occasion chips + example teaser

**Files:**
- Modify: `src/app/components/landing.component.ts`
- Modify: `src/app/components/landing.component.html`
- Modify: `src/app/components/landing.component.css`

- [ ] **Step 1: Replace searchChips with occasion chips in landing.component.ts**

Open `src/app/components/landing.component.ts`. Find the `searchChips` array (lines ~32-45):

```typescript
  searchChips = [
    {
      text: 'Romantic weekend in NYC',
      icon: 'ph ph-heart'
    },
    {
      text: 'Hotels in Manhattan under $300',
      icon: 'ph ph-tag'
    },
    {
      text: 'Pet-friendly hotel near Empire State Building',
      icon: 'ph ph-paw-print'
    }
  ];
```

Replace with:

```typescript
  searchChips = [
    {
      text: 'Family trip to NYC',
      icon: 'ph ph-baby'
    },
    {
      text: 'Romantic weekend in Manhattan',
      icon: 'ph ph-heart'
    },
    {
      text: 'Business stay near Midtown',
      icon: 'ph ph-briefcase'
    },
    {
      text: 'Special occasion — anniversary',
      icon: 'ph ph-sparkle'
    }
  ];
```

- [ ] **Step 2: Add exampleTeaser property**

In `landing.component.ts`, after the `searchChips` array, add:

```typescript
  exampleTeaser = {
    userMessage: 'Family of 4, close to Times Square, somewhere the kids will love',
    aiReply: 'Found 3 great matches — Holiday Inn Times Square has kids eat free 🎉'
  };
```

- [ ] **Step 3: Update landing.component.html — desktop example teaser**

In `landing.component.html`, find the desktop section. Locate the `input-container` div that contains `<div class="desktop-try-searching">`. Before the `desktop-try-searching` div, add the example teaser:

```html
          <!-- Example teaser — shows value before user clicks in -->
          <div class="example-teaser">
            <div class="example-teaser-label">SEE HOW IT WORKS</div>
            <div class="example-teaser-body">
              <div class="example-user-row">
                <div class="example-avatar example-avatar-user"></div>
                <div class="example-bubble-user">{{ exampleTeaser.userMessage }}</div>
              </div>
              <div class="example-ai-row">
                <div class="example-avatar example-avatar-ai">✦</div>
                <div class="example-bubble-ai">{{ exampleTeaser.aiReply }}</div>
              </div>
            </div>
          </div>
```

- [ ] **Step 4: Update the "TRY SEARCHING" label to reflect occasion framing**

In `landing.component.html`, find:

```html
            <span class="try-label">TRY SEARCHING:</span>
```

Replace with:

```html
            <span class="try-label">WHAT'S THE OCCASION?</span>
```

- [ ] **Step 5: Add example teaser to mobile landing**

In `landing.component.html`, find the mobile landing section (inside `<div class="landing-mobile">`). Add the same teaser block before the search chips section:

```html
          <!-- Example teaser — mobile -->
          <div class="example-teaser example-teaser-mobile">
            <div class="example-teaser-label">SEE HOW IT WORKS</div>
            <div class="example-teaser-body">
              <div class="example-user-row">
                <div class="example-avatar example-avatar-user"></div>
                <div class="example-bubble-user">{{ exampleTeaser.userMessage }}</div>
              </div>
              <div class="example-ai-row">
                <div class="example-avatar example-avatar-ai">✦</div>
                <div class="example-bubble-ai">{{ exampleTeaser.aiReply }}</div>
              </div>
            </div>
          </div>
```

- [ ] **Step 6: Add CSS for example teaser**

Open `src/app/components/landing.component.css`. Add at the end:

```css
/* ── Example Teaser ─────────────────────────────── */
.example-teaser {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
}

.example-teaser-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  opacity: 0.5;
  color: white;
  margin-bottom: 10px;
}

.example-user-row,
.example-ai-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}
.example-ai-row { margin-bottom: 0; }

.example-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
}

.example-avatar-user {
  background: #6366f1;
}

.example-avatar-ai {
  background: #4f46e5;
  color: white;
}

.example-bubble-user {
  font-size: 11px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.85);
  flex: 1;
}

.example-bubble-ai {
  font-size: 11px;
  line-height: 1.4;
  color: #a5b4fc;
  flex: 1;
}

.example-teaser-mobile {
  max-width: 100%;
}
```

- [ ] **Step 7: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | head -10
```

- [ ] **Step 8: Commit**

```bash
git add src/app/components/landing.component.ts src/app/components/landing.component.html src/app/components/landing.component.css
git commit -m "feat: occasion chips and example teaser on landing page"
```

---

## Task 11: Booking hand-off overlay

**Files:**
- Modify: `src/app/components/hotel-detail-drawer.component.html`
- Modify: `src/app/components/hotel-detail-drawer.component.ts`
- Modify: `src/app/components/hotel-detail-drawer.component.css`
- Modify: `src/app/components/hotel-detail-bottom-sheet.component.html`
- Modify: `src/app/components/hotel-detail-bottom-sheet.component.ts`
- Modify: `src/app/components/hotel-detail-bottom-sheet.component.css`

- [ ] **Step 1: Add showHandoff flag to drawer component**

Open `src/app/components/hotel-detail-drawer.component.ts`. Add a property:

```typescript
/** Whether to show the booking hand-off confirmation overlay */
showHandoff: boolean = false;
```

- [ ] **Step 2: Update viewRooms() to show overlay instead of emitting**

Find the existing `viewRooms()` method (line ~712):

```typescript
  viewRooms(): void {
    this.viewRoomsRequested.emit(this.hotel);
  }
```

Replace with:

```typescript
  viewRooms(): void {
    this.showHandoff = true;
  }

  confirmViewRooms(): void {
    this.showHandoff = false;
    this.viewRoomsRequested.emit(this.hotel);
  }

  cancelHandoff(): void {
    this.showHandoff = false;
  }
```

- [ ] **Step 3: Add hand-off overlay to drawer HTML**

Open `src/app/components/hotel-detail-drawer.component.html`. Just before the closing `</div>` of the outermost drawer container, add:

```html
<!-- Booking hand-off confirmation overlay -->
<div *ngIf="showHandoff" class="handoff-overlay" role="dialog" aria-modal="true" aria-label="Continue to booking">
  <div class="handoff-card">
    <div class="handoff-hotel-row">
      <div class="handoff-hotel-icon">🏨</div>
      <div>
        <div class="handoff-hotel-name">{{ hotel?.name }}</div>
        <div class="handoff-hotel-sub">IHG secure booking page</div>
      </div>
    </div>

    <div class="handoff-carryover">
      <div class="handoff-carryover-label">Carrying over from your search:</div>
      <div *ngIf="adults || children" class="handoff-carryover-item">
        <span class="handoff-check">✓</span>
        <span>{{ (adults || 0) + (children || 0) }} guests
          <span *ngIf="children"> · {{ children }} {{ children === 1 ? 'child' : 'children' }}</span>
        </span>
      </div>
      <div *ngIf="checkInDate && checkOutDate" class="handoff-carryover-item">
        <span class="handoff-check">✓</span>
        <span>{{ checkInDate | date:'MMM d' }} → {{ checkOutDate | date:'MMM d' }}</span>
      </div>
      <div *ngIf="!checkInDate && !checkOutDate && !adults && !children" class="handoff-carryover-item">
        <span class="handoff-check">✓</span>
        <span>Your search criteria</span>
      </div>
    </div>

    <div class="handoff-actions">
      <button class="handoff-confirm" (click)="confirmViewRooms()">Continue to booking →</button>
      <button class="handoff-cancel" (click)="cancelHandoff()">Stay here</button>
    </div>
  </div>
</div>
```

Note: Check which `@Input()` names are used for `adults`, `children`, `checkInDate`, `checkOutDate` in the drawer component TS — adjust the template references to match the actual property names.

- [ ] **Step 4: Add hand-off overlay CSS to drawer**

Open `src/app/components/hotel-detail-drawer.component.css`. Add at the end:

```css
/* ── Booking hand-off overlay ───────────────────── */
.handoff-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 24px;
  z-index: 100;
  border-radius: inherit;
}

.handoff-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.handoff-hotel-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.handoff-hotel-icon {
  width: 36px;
  height: 36px;
  background: #f0fdf4;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.handoff-hotel-name {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2px;
}

.handoff-hotel-sub {
  font-size: 11px;
  color: #9ca3af;
}

.handoff-carryover {
  background: #f9fafb;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.handoff-carryover-label {
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.handoff-carryover-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #374151;
  margin-bottom: 4px;
}

.handoff-check {
  color: #4f46e5;
  font-weight: 700;
  flex-shrink: 0;
}

.handoff-actions {
  display: flex;
  gap: 10px;
}

.handoff-confirm {
  flex: 1;
  background: #1F4456;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.handoff-confirm:hover {
  background: #2a5a73;
}

.handoff-cancel {
  background: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}

.handoff-cancel:hover {
  background: #e5e7eb;
}
```

- [ ] **Step 5: Repeat for bottom sheet (mobile)**

Open `src/app/components/hotel-detail-bottom-sheet.component.ts`. Add the same three methods:

```typescript
showHandoff: boolean = false;

viewRooms(): void {
  this.showHandoff = true;
}

confirmViewRooms(): void {
  this.showHandoff = false;
  this.viewRoomsRequested.emit(this.hotel);
}

cancelHandoff(): void {
  this.showHandoff = false;
}
```

Open `src/app/components/hotel-detail-bottom-sheet.component.html`. Add the same overlay HTML (identical to drawer, copy exactly) just before the bottom sheet's outermost closing tag.

Open `src/app/components/hotel-detail-bottom-sheet.component.css`. Add the same CSS block (identical to drawer).

- [ ] **Step 6: Verify build**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | head -10
```

- [ ] **Step 7: Commit**

```bash
git add src/app/components/hotel-detail-drawer.component.* src/app/components/hotel-detail-bottom-sheet.component.*
git commit -m "feat: booking hand-off confirmation overlay before loading rooms"
```

---

## Task 12: End-to-end verification

- [ ] **Step 1: Serve the app**

```bash
npm start
```
Open `http://localhost:4200`

- [ ] **Step 2: Verify landing page**

- [ ] Example teaser visible on desktop and mobile landing views — shows user message + AI reply in miniature chat bubbles
- [ ] Chips now show occasion labels: "Family trip to NYC", "Romantic weekend in Manhattan", "Business stay near Midtown", "Special occasion — anniversary"
- [ ] "WHAT'S THE OCCASION?" label replaces "TRY SEARCHING:"

- [ ] **Step 3: Verify scope note on first AI response**

- [ ] Type any query → first AI response ends with "ℹ️ I'll find your match — you'll complete booking on the hotel's secure page."
- [ ] Second and subsequent responses do NOT include the scope note

- [ ] **Step 4: Verify suggested reply chips**

- [ ] Send a vague query (e.g. "I need a hotel") → AI asks one clarifying question → tappable chips appear below the response (e.g. "Under 10", "Teens", "Skip")
- [ ] Clicking a chip submits it as a user message and clears the chips
- [ ] A direct, specific query (e.g. "Hotels in Times Square under $300") → no chips shown, results appear directly

- [ ] **Step 5: Verify persistent filter chips**

- [ ] After first search, active filter chips appear below input (location, price, etc.)
- [ ] Removing a chip updates results without retyping

- [ ] **Step 6: Verify hotel card match callout**

- [ ] Search for something specific (e.g. "family hotel near Times Square") → hotel cards show % match badge
- [ ] High-scoring cards (≥90%) show blue badge + green "Why this fits" callout
- [ ] Lower-scoring cards (75–89%) show amber badge + amber "What's missing" callout

- [ ] **Step 7: Verify booking hand-off overlay**

- [ ] Click any hotel card → open detail drawer → click "View Rooms" → overlay appears showing hotel name, carried-over guests/dates
- [ ] Click "Stay here" → overlay dismisses, drawer remains open
- [ ] Click "Continue to booking →" → overlay closes, rooms load in chat
- [ ] Same behaviour in mobile bottom sheet

- [ ] **Step 8: Final commit**

```bash
git add -A && git status
# Confirm nothing unexpected staged
git commit -m "chore: verify all post-user-testing improvements complete"
```
