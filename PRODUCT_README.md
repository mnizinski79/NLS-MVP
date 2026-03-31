# IHG Hotel Search — Product & Feature Documentation

This document is intended for the development lead and product owner. It covers every feature, how it works technically, and the full AI prompting and rules system.

---

## Overview

IHG Hotel Search is a conversational AI-powered hotel search experience built in Angular. Users interact with a natural language chat interface to find IHG hotels across the New York City metro area (70+ hotels). The app supports IHG One Rewards points pricing alongside cash rates. It is responsive — desktop uses a split/floating panel layout, mobile uses a full-screen chat with a bottom sheet for hotel details.

The AI is powered by Google Gemini 2.5 Flash via REST API.

---

## Application Layout

### Desktop
- Full-screen landing page with a centered floating chat panel (480px wide)
- Background is a light grey gradient
- After first message, transitions to a split layout: chat panel on the left, interactive map on the right
- Hotel detail opens in a slide-in drawer from the right (33% width)

### Mobile
- Full-screen landing page with fixed input bar at the bottom
- After first message, transitions to a scrollable chat view
- Hotel cards appear inline within the chat
- Hotel detail opens as a bottom sheet (full screen)
- Map is accessible via "View All on Map" button

---

## Landing Page

### Desktop
- Centered floating panel with IHG banner, sparkle icon, "Where to?" heading, tagline, card ticker, and chat input
- Card ticker: continuous right-to-left scrolling strip of LocationBrandCard images (property photos with brand/location labels), driven by `requestAnimationFrame` for seamless looping
- Chat input has a `#1F4456` border (IHG dark teal) and the send button is always in its active state
- No "Try asking" chips on desktop

### Mobile
- Same content structure: sparkle → "Where to?" → tagline → card ticker → input
- Input is fixed at the bottom of the screen
- Card ticker uses the same JS-driven scroll

### Card Ticker Technical Details
- 6 LocationBrandCard PNG images (`LocationBrandCard-IC.png`, `-IN.png`, `-K.png`, `-Reg.png`, `-SS.png`, `-Vig.png`)
- Doubled to 12 for seamless loop
- `requestAnimationFrame` increments `offset` by `0.3px` per frame
- When `offset >= scrollWidth / 2`, it resets to `offset - scrollWidth / 2` — this is the seamless loop point
- Cards are flat (no stagger), `22vh` tall, `8px` gap

---

## Chat Interface

### Message Flow
1. User types a message and submits
2. "Thinking" animation appears
3. AI processes the query (Gemini API, 30s timeout, 2 retries)
4. AI response renders with markdown formatting (bold, bullets, line breaks)
5. Hotel cards appear below the AI message (desktop: in right panel / map; mobile: inline in chat)

### Conversation State
The app maintains a `ConversationState` object that persists across messages:
- `lastQuery` — previous user message
- `lastIntent` — previous AI intent
- `conversationContext.location` — confirmed location
- `conversationContext.guestCount` — confirmed guest count
- `lastDisplayedHotels` — hotels currently shown (used for refinement)
- `focusedHotel` — hotel whose detail view is currently open

This state is passed to the AI on every message so it has full context.

### Collapsed/Expanded View
On desktop, the chat panel can be collapsed to show only the most recent message. The chevron button toggles this.

### Date Picker
- Appears inline in the chat after AI response when ≤3 results are returned
- On mobile, a "Select Dates" button appears below hotel cards
- Once dates are selected, they persist in conversation state and are passed to hotel detail views

### Rate Calendar
- Appears inline in chat when the AI triggers a rate calendar response
- Shows nightly rates with visual pricing indicators
- Selecting dates from the rate calendar updates the hotel detail booking flow

---

## Hotel Cards

### Desktop
- Cards appear in the right panel (map area) as an overlay list
- Each card shows: hotel image, name, brand logo, neighborhood, rating, nightly rate
- Clicking a card opens the hotel detail drawer

### Mobile
- Cards appear inline in the chat conversation
- Same information as desktop cards
- Tapping a card opens the hotel detail bottom sheet

---

## Hotel Detail — Desktop (Drawer)

A slide-in panel from the right side of the screen.

### Sections
- Image gallery with left/right navigation (keyboard arrow keys supported)
- Hotel name, brand logo, star rating
- Description
- Distance from POI (if a point of interest was mentioned in the query) — shown below description
- Amenities list
- Address + "Visit website →" link (opens hotel's IHG booking page)
- Rate calendar for date selection
- Guest count selector (adults + children, stepper UI)
- Sticky footer with "Check availability" CTA. If guest count and select dates is confirmed by the user, the sticky footer shows "Check availabilty" as asecondary button, and "View rooms" as a primary button

### Booking Flow
1. User selects dates in the rate calendar
2. User adjusts guest count (default: 2 adults, 0 children)
3. "View Rooms" button becomes active
4. Clicking opens the IHG booking URL with dates and guest count pre-filled as query parameters:
   - `qAdlt` = adults
   - `qChld` = children
   - `qCiD` / `qCiMy` = check-in day / month+year
   - `qCoD` / `qCoMy` = check-out day / month+year

### Accessibility
- Focus is trapped within the drawer when open
- Escape key closes the drawer
- Arrow keys navigate the image gallery
- Focus is restored to the triggering element on close

---

## Hotel Detail — Mobile (Bottom Sheet)

Full-screen bottom sheet with identical content to the desktop drawer.

### Additional Mobile Behaviors
- Swipe down to dismiss (in map context)
- Starts in a "peek" state, expands to full screen
- Scroll container is separate from the drag handle area

---

## Map

### Desktop
- Occupies the right panel after the landing page
- Shows all currently displayed hotels as map markers
- Clicking a marker opens the hotel detail drawer
- If a POI was mentioned (e.g., "near Central Park"), a POI marker is shown on the map
- Map updates whenever hotel results change

### Mobile
- Accessible via "View All on Map" button below hotel cards
- Opens a full-screen map overlay
- Tapping a hotel marker opens the bottom sheet

---

## AI System — Complete Implementation Guide

This section contains everything needed to replicate the AI behavior. The AI is powered by Google Gemini 2.5 Flash and returns structured JSON that drives the entire UI.

### Architecture Overview

```
User types message
    ↓
app.component.ts → ai.service.ts.processQuery()
    ↓
Points detection (switches pricing mode if "points"/"cash" keywords found)
    ↓
buildPrompt() assembles system prompt + conversation context + user query
    ↓
POST to Gemini API (30s timeout, 2 retries with backoff)
    ↓
parseResponse() extracts JSON from Gemini response
    ↓
validateAIResponse() checks required fields and types
    ↓
Sentence count enforced (max 4, truncated if exceeded)
    ↓
AIResponse returned to app.component.ts
    ↓
app.component.ts routes based on intent:
  - shouldSearch=true → hotel.service.ts.filterHotels() → display results
  - shouldRefine=true → filter currently displayed hotels
  - hotel_info → answer question, no search
  - preferences_only → show message only, no results
    ↓
If API fails → fallbackProcessing() runs keyword extraction locally
```

### Gemini API Configuration

```typescript
// Endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Request payload
{
  contents: [{ parts: [{ text: systemPrompt + userQuery + context }] }],
  generationConfig: {
    temperature: 0.7,
    responseMimeType: "application/json"  // Forces JSON output
  }
}

// Timeout: 30,000ms
// Retries: 2 (1s, 2s backoff)
```

### AI Response JSON Schema

Every Gemini response must match this exact structure:

```json
{
  "intent": "show_results_now",
  "message": "Here are 6 hotels in **Midtown**!\\n\\nWant to filter by price or amenities?",
  "searchCriteria": {
    "brands": ["Kimpton", "voco"],
    "sentiments": ["NYC", "Midtown"],
    "amenities": ["Rooftop Bar", "Pet Friendly"],
    "priceRange": { "min": 200, "max": 400 },
    "minRating": 4.0,
    "sortBy": "price_asc"
  },
  "shouldSearch": true,
  "shouldRefine": false,
  "specificHotelId": null,
  "checkIn": "2026-08-15",
  "checkOut": "2026-08-18",
  "adults": 2,
  "children": 0,
  "pointOfInterest": {
    "name": "Central Park",
    "coordinates": { "lat": 40.785091, "lng": -73.968285 }
  }
}
```

### Required Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `intent` | string | Yes | One of the valid intent types (see below) |
| `message` | string | Yes | Markdown-formatted response text (max 4 sentences) |
| `shouldSearch` | boolean | Yes | Whether to run a new search against all hotels |
| `shouldRefine` | boolean | Yes | Whether to filter currently displayed hotels |
| `searchCriteria` | object | No | Filter criteria (see below) |
| `specificHotelId` | string | No | Hotel ID for detail queries |
| `checkIn` | string | No | ISO date (YYYY-MM-DD) |
| `checkOut` | string | No | ISO date (YYYY-MM-DD) |
| `adults` | number | No | Number of adult guests |
| `children` | number | No | Number of children |
| `pointOfInterest` | object | No | Landmark for map display |

### Intent Types

| Intent | shouldSearch | shouldRefine | Behavior |
|---|---|---|---|
| `show_all` | true | false | Show all hotels, no filters |
| `show_results_now` | true | false | Show results for any search criteria |
| `complete_query` | true | false | Full search with all criteria |
| `location_only` | true | false | Location provided, no other criteria |
| `preferences_only` | false | false | Amenity only, no location — ask for location |
| `vague` | false | false | No actionable criteria — ask clarifying question |
| `cheapest` | true/false | false/true | Sort by price ascending (new search or refine) |
| `most_expensive` | true/false | false/true | Sort by price descending (new search or refine) |
| `hotel_info` | false | false | Answer question about displayed hotels |
| `refine_search` | false | true | Filter currently displayed hotels |

`shouldSearch` and `shouldRefine` are mutually exclusive — never both true.

### SearchCriteria Fields

```typescript
interface SearchCriteria {
  brands?: string[];      // ["Kimpton", "voco", "InterContinental", ...]
  sentiments?: string[];  // ["NYC", "Manhattan", "Times Square", "Midtown", ...]
  amenities?: string[];   // ["Rooftop Bar", "Fitness Center", "Pet Friendly", ...]
  priceRange?: {
    min?: number;         // Minimum nightly rate (USD)
    max?: number;         // Maximum nightly rate (USD)
  };
  minRating?: number;     // Minimum star rating (1-5)
  sortBy?: 'price_asc' | 'price_desc' | 'rating_desc';
}
```

### Filter Pipeline

When `shouldSearch=true`, the hotel service applies filters in this order:

1. Brand filter (OR logic — hotel matches any listed brand)
2. Sentiment filter (OR logic — hotel has any listed sentiment)
3. Price range filter (if 0 results, removes price filter and sorts by price)
4. Amenities filter (OR logic — hotel has any listed amenity)
5. Rating filter (hotel rating >= minRating)
6. Fallback: if location was specified but 0 results, shows top 3 by rating
7. Sort (if specified)

### Available Data Values

**Sentiments (location tags):**
NYC, New York, Manhattan, New York City, Times Square, Midtown, Broadway, Theater District, Rockefeller Center, Chelsea, SoHo, Financial District, Downtown, Brooklyn, Bronx, Long Island City, Jersey City, New Jersey, Near NYC

**Amenities:**
Rooftop Bar, Fitness Center, Pet Friendly, Free Wi-Fi, Restaurant, Room Service, Concierge, Business Center, Suites, Sustainable Practices, Entertainment

**Brands:**
Kimpton, voco, InterContinental, Holiday Inn, Holiday Inn Express, Crowne Plaza, Indigo, Candlewood, Independent

### Conversation Context

Every AI call includes the full conversation state:

```typescript
interface ConversationState {
  lastQuery: string | null;           // Previous user message
  lastIntent: IntentType | null;      // Previous AI intent
  conversationContext: {
    location: string | null;          // Confirmed location
    guestCount: number | null;        // Confirmed guest count
    brands: string[];
    sentiments: string[];
    amenities: string[];
    priceRange: { min: number | null; max: number | null };
    checkIn: Date | null;
    checkOut: Date | null;
  };
  lastDisplayedHotels: Hotel[];       // Currently shown hotels (for refinement)
  focusedHotel: Hotel | null;         // Hotel detail view is open for this hotel
  pointOfInterest: PointOfInterest | null;
  turnCount: number;
}
```

When `focusedHotel` is set, the prompt includes the hotel's full details (name, brand, price, rating, description, amenities) and instructs the AI that "this hotel" / "it" / "here" refers to that hotel.

When `lastDisplayedHotels` is populated, the prompt includes all displayed hotels with their details so the AI can answer questions about them.

### System Prompt Structure

The prompt sent to Gemini is assembled in `buildPrompt()` and follows this structure:

```
1. Identity & personality (IHG assistant, warm, conversational)
2. IHG One Rewards & points awareness
3. Core personality rules
4. Markdown formatting requirements
5. Response length limits (max 4 sentences)
6. Post-results behavior (always end with action item)
7. Contextual anchoring principles
8. Affirmation variety (rotate openers)
9. Show-all override triggers
10. "Show results first" critical rule
11. Location requirement for amenity-only queries
12. Trigger phrases for immediate results
13. Response formatting rules (never list hotel names, etc.)
14. Date & guest count extraction rules
15. Available data attributes (sentiments, amenities, brands)
16. Non-existent amenity handling
17. Price interpretation (always per night)
18. Sentiment mapping table
19. Family Friendly rules
20. Budget interpretation
21. JSON output instruction
22. Message formatting requirements
23. Date extraction with relative date examples
24. Guest count extraction examples
25. POI extraction with coordinates
26. JSON schema
27. Special intent rules
28. Refinement rules
29. [Conversation context appended dynamically]
30. [User query]
```

### Fallback Processor

If the Gemini API fails, `fallbackProcessing()` runs locally:

1. Extracts location keywords → maps to sentiments
2. Extracts brand keywords → maps to brand filter
3. Extracts amenity keywords → maps to amenity filter
4. Extracts price keywords → maps to price range
5. Detects points/cash keywords → switches pricing mode
6. Returns a generic AIResponse with `shouldSearch: true`

Location mappings in fallback:
- "nyc" / "new york" → `["NYC"]`
- "manhattan" → `["Manhattan"]`
- "brooklyn" → `["Brooklyn"]`
- "midtown" → `["Midtown"]`
- "times square" → `["Times Square"]`
- "downtown" / "financial district" → `["Downtown", "Financial District"]`

### Validation Rules

The `validateAIResponse()` method checks:
- `intent` is present and one of the valid types
- `message` is present and is a string
- `shouldSearch` is a boolean
- `shouldRefine` is a boolean
- `searchCriteria` (if present) has correct field types
- `sortBy` (if present) is one of: `price_asc`, `price_desc`, `rating_desc`

If validation fails, the fallback processor runs instead.

### Message Formatting

AI messages use markdown that gets rendered by the `MarkdownPipe`:
- `**bold**` → `<strong>bold</strong>`
- `\\n\\n` → line breaks
- `- item` → bullet points
- Messages are capped at 4 sentences (enforced by `truncateToSentences()`)

### Points Mode Detection

At the start of every `processQuery()` call:

```typescript
const pointsKeywords = ['points', 'rewards', 'redeem', 'use points', 'book with points', 'how many points', 'pts'];
const cashKeywords = ['dollars', 'cash', 'usd', 'show me prices', 'cash price', 'dollar price'];

if (pointsKeywords.some(k => query.toLowerCase().includes(k))) {
  this.pricing.setMode('points');
} else if (cashKeywords.some(k => query.toLowerCase().includes(k))) {
  this.pricing.setMode('cash');
}
```

This runs before the API call, so the UI switches immediately.

---

## AI Prompt Rules

The full system prompt is sent on every message. Key rules:

### Personality
- Warm, conversational, knowledgeable — like a well-traveled local expert
- Never robotic or clipped
- Uses contractions and natural phrasing
- Rotates affirmation openers: "On it!", "Let's see what we've got!", "Great choice!", etc. — never repeats the same opener twice in a row

### Response Length
- Maximum 3 sentences for simple queries
- Maximum 4 sentences for complex queries
- Always ends with exactly ONE action item (offer to refine, ask about dates, or highlight a standout feature)
- Never repeats information already shown in hotel cards

### Markdown Formatting
- Always uses `**bold**` for key terms (amenities, locations, brands, features)
- Uses `\n\n` for line breaks between thoughts
- Uses `- ` bullet points when listing 2+ items
- In JSON responses, newlines are escaped as `\\n\\n`

### Show Results First — Critical Rule
- ALWAYS show results immediately when the user mentions ANY search criteria
- NEVER hold results behind clarifying questions
- Only ask clarifying questions if the query is completely vague (e.g., "help me" with no context)

### Location Requirement for Amenity-Only Queries
- If user asks ONLY about amenities without a location (e.g., "hotels with a pool"), do NOT show results
- Ask for location first, mentioning example cities where that amenity exists
- If user specifies both location AND amenity, always show results

### Non-Existent Amenities
- Only the following amenities exist in the data: Rooftop Bar, Fitness Center, Pet Friendly, Free Wi-Fi, Spa, Restaurant, Room Service, Concierge, Hosted Wine Hour, Cocktail Bar, Terrace Rooms, Business Center, Grab & Go Market
- If user asks for an amenity not in this list (e.g., Pool, Parking, Valet), show all hotels in the location and honestly explain the amenity isn't available, then suggest alternatives
- Never say "here are hotels with [non-existent amenity]"

### Price Interpretation
- All prices are always per night — never total trip cost
- If user says "$350 budget" for a 4-night stay, `priceRange.max` = 350 (not 87.50)
- Set `priceRange.max` to exactly the user's stated budget; the backend handles showing over-budget options if needed

### Sentiment Mapping
| User says | Maps to |
|---|---|
| "romantic" | amenities: ["Rooftop Bar"] |
| "luxury" / "upscale" | sentiments: ["Luxury"] or priceRange.min: 400 |
| "budget" / "affordable" | sentiments: ["Value"] or priceRange.max: 200 |
| "central" / "convenient" | sentiments: ["Times Square", "Central Location"] |
| "Times Square" / "Broadway" | sentiments: ["Times Square", "Broadway", "Theater District"] |
| "family-friendly" (explicit) | sentiments: ["Family Friendly"] |
| "traveling with kids" (implicit) | guest count only — NOT Family Friendly |

### Guest Count Extraction
- "going with 3 friends" = 4 adults (user + 3)
- "me and my partner" = 2 adults
- "family of 4" = 4 adults (unless children explicitly mentioned)
- "2 adults and 2 kids" = 2 adults, 2 children
- Adults and children are extracted as separate fields

### Date Extraction
- Supports specific dates ("March 15"), relative dates ("this weekend", "next Friday", "tomorrow")
- "This weekend" = Friday–Sunday of the closest upcoming weekend
- "Next weekend" = Friday–Sunday of the weekend after "this weekend"
- Weekends are always Friday check-in, Sunday check-out
- Dates are returned in ISO format (YYYY-MM-DD)

### Point of Interest (POI) Extraction
- Extracts landmarks mentioned by the user (Central Park, Times Square, Rockefeller Center, Empire State Building, Broadway, Grand Central, Madison Square Garden, Bryant Park)
- POI is for map display only — it does NOT filter hotel results
- All hotels are still shown; the POI marker appears on the map alongside them
- AI acknowledges the POI in its message: "I'll mark Central Park on the map so you can see what's nearby"

### Intent Types
| Intent | Behavior |
|---|---|
| `show_all` | Show all hotels, no filters |
| `show_results_now` | Show results immediately for any search criteria |
| `complete_query` | Full search with criteria |
| `location_only` | Location provided, no other criteria |
| `preferences_only` | Amenity/preference only, no location — ask for location |
| `vague` | No actionable criteria — ask clarifying question |
| `cheapest` | Sort by price ascending |
| `most_expensive` | Sort by price descending |
| `hotel_info` | Answer question about displayed hotels using context |
| `refine_search` | Filter currently displayed hotels (not all hotels) |

### Refinement vs. New Search
- `shouldSearch: true` = run a new search against all hotels
- `shouldRefine: true` = filter the currently displayed hotels
- These are mutually exclusive — never both true at the same time
- If user says "which ones have a rooftop bar" when hotels are displayed → `shouldRefine: true`
- If user says "show me hotels with a rooftop bar" fresh → `shouldSearch: true`

### Show All Override
Trigger phrases that return ALL hotels with no filters:
- "show me all hotels", "show me everything", "remove filters", "show all", "clear filters", "just show me all of them"

### Response Naming Rules
- Never list hotel names in the AI message text — the cards show the names
- Never reference a specific amenity without naming the hotel ("the hotel with the wine hour" is bad; "the Kimpton Theta has a hosted wine hour" is correct)
- Use singular "hotel" for 1 result, plural for multiple

### Date Prompt Rules
- When ≤3 results are returned, do NOT prompt for dates — the UI date picker handles this automatically
- For ≥4 results, asking about dates is the natural ONE follow-up
- Never stack date AND guest count questions in the same response

---

## AI Response JSON Structure

Every AI response must be valid JSON matching this structure:

```json
{
  "intent": "show_results_now | complete_query | refine_search | ...",
  "message": "Formatted response string with **bold**, \\n\\n line breaks, - bullets",
  "searchCriteria": {
    "brands": ["Kimpton", "voco"],
    "sentiments": ["Times Square", "Luxury"],
    "amenities": ["Rooftop Bar", "Pet Friendly"],
    "priceRange": { "min": 200, "max": 400 },
    "minRating": 4.0,
    "sortBy": "price_asc | price_desc | rating_desc | null"
  },
  "shouldSearch": true,
  "shouldRefine": false,
  "specificHotelId": null,
  "checkIn": "2026-03-15",
  "checkOut": "2026-03-17",
  "adults": 2,
  "children": 0,
  "pointOfInterest": {
    "name": "Central Park",
    "coordinates": { "lat": 40.785091, "lng": -73.968285 }
  }
}
```

---

## Available Search Data

All hotels are in New York City. The following attributes exist in the dataset:

**Locations/Sentiments:** Times Square, Broadway, Theater District, Rockefeller Center, Modern, Luxury, Rooftop Bar, Central Location, Value, Family Friendly, Convenient, Skyline Views, New Opening, City Views

**Amenities:** Rooftop Bar, Fitness Center, Pet Friendly, Free Wi-Fi, Spa, Restaurant, Room Service, Concierge, Hosted Wine Hour, Cocktail Bar, Terrace Rooms, Business Center, Grab & Go Market

**Brands:** Kimpton, voco, InterContinental, Holiday Inn, Holiday Inn Express, Crowne Plaza, Indigo, Candlewood, Independent

**Price ranges:** Budget (<$200/night), Mid-range ($200–400/night), Luxury (>$400/night)

---

## IHG One Rewards Points Pricing

The app supports switching between cash (USD) and IHG One Rewards points pricing across all price-displaying surfaces.

### How It Works
- A central `PricingService` manages a global `displayMode` (`'cash'` or `'points'`)
- All components that display prices read from this service
- Points are calculated at 125x the cash rate (e.g., $200/night = 25,000 pts/night)
- The multiplier is defined in `PricingService.POINTS_MULTIPLIER`

### Surfaces That Update
- Hotel cards (nightly rate + breakdown)
- Map pins (price label)
- Rate calendar (daily prices, nightly rate summary, total)
- Hotel detail drawer and bottom sheet (when price display is added)

### AI Detection
The AI automatically detects points-related intent and switches the mode:
- **Points triggers:** "points", "rewards", "redeem", "use points", "book with points", "how many points", "pts"
- **Cash triggers:** "dollars", "cash", "usd", "show me prices", "cash price", "dollar price"
- Detection runs at the start of `processQuery()` before the AI call, so the mode switches immediately
- The AI prompt instructs Gemini to acknowledge the switch naturally (e.g., "Switching to points view!")

### Technical Details
- `PricingService` exposes a `mode$` BehaviorSubject observable
- The map component subscribes to `mode$` and re-renders all markers when the mode changes
- Hotel cards use `pricing.formatRateNumber()` and `pricing.unitLabel` in the template
- The rate calendar uses `pricing.formatRateNumber()` for day cells and `pricing.formatRate()` for summaries

---

## Tech Stack

- Angular 17 (standalone components)
- Google Gemini 2.5 Flash (AI)
- Leaflet with MarkerCluster (map)
- Phosphor Icons (UI icons)
- Node.js / Express (local API server for config)
- `concurrently` to run API server and Angular dev server together (`npm run start:dev`)

---

## Developer Guide

### Getting Started

```bash
# Install dependencies
npm install

# Set your Gemini API key in .env
GEMINI_API_KEY=your_key_here

# Run dev server (API + Angular)
npm run start:dev

# App: http://localhost:4200
# API: http://localhost:3000
```

### Project Structure

```
src/app/
├── app.component.ts          # Root component — orchestrates all state, AI calls, hotel display
├── components/
│   ├── landing.component.*    # Landing page (ticker, search chips, Leaflet bg map)
│   ├── desktop-layout.component.*  # Desktop split view (chat + map + cards)
│   ├── mobile-layout.component.*   # Mobile layout (chat + inline cards)
│   ├── chat.component.*      # Chat message list (collapsed/expanded, date picker, rate calendar)
│   ├── input.component.*     # Chat input field with send button
│   ├── hotel-card.component.* # Hotel card (desktop + mobile variants)
│   ├── hotel-detail-drawer.component.*  # Desktop hotel detail (slide-in right panel)
│   ├── hotel-detail-bottom-sheet.component.*  # Mobile hotel detail (full-screen sheet)
│   ├── map.component.*       # Leaflet map with clustered markers
│   ├── rate-calendar.component.*  # Rate calendar with daily pricing
│   ├── date-picker.component.*    # Simple date range picker
│   ├── helper-tags.component.*    # Amenity/location filter chips
│   ├── thinking-animation.component.ts  # AI thinking dots
│   └── password-gate.component.ts  # Optional password protection
├── models/
│   ├── hotel.model.ts         # Hotel interface
│   ├── ai-response.model.ts   # AIResponse, PointOfInterest interfaces
│   ├── search-criteria.model.ts  # SearchCriteria interface
│   ├── conversation-state.model.ts  # ConversationState, IntentType
│   ├── brand-config.ts        # Brand colors + logo paths
│   ├── message.model.ts       # Chat message interface
│   └── index.ts               # Barrel exports
├── services/
│   ├── ai.service.ts          # Gemini API integration + full system prompt
│   ├── hotel.service.ts       # Hotel data loading + filter pipeline
│   ├── map.service.ts         # Marker creation + map utilities
│   ├── pricing.service.ts     # Cash/points pricing mode
│   ├── config.service.ts      # API key + app config
│   ├── conversation.service.ts  # Conversation state management
│   ├── date.service.ts        # Date parsing utilities
│   ├── animation.service.ts   # Transition animations
│   └── accessibility.service.ts  # Focus management, screen reader
├── pipes/
│   └── markdown.pipe.ts       # Converts markdown to HTML in chat messages
```

### Key Files for Common Tasks

| Task | File(s) |
|---|---|
| Change AI behavior/prompt | `ai.service.ts` → `buildPrompt()` |
| Add/modify hotel data | `src/assets/hotels.json` + `scripts/merge-hotels.js` |
| Change map pin appearance | `map.service.ts` → `getMarkerHtml()` |
| Add a new brand | `hotel.model.ts` (type), `brand-config.ts` (color + logo), `merge-hotels.js` (mapping) |
| Modify hotel card layout | `hotel-card.component.html` + `.css` |
| Change border radius globally | `src/styles.css` → `:root` CSS variables |
| Switch points multiplier | `pricing.service.ts` → `POINTS_MULTIPLIER` |
| Add new amenity icons | `hotel-detail-drawer.component.ts` + `hotel-detail-bottom-sheet.component.ts` → `getAmenitiesWithIcons()` |

### Design Tokens

All border-radius values use CSS custom properties defined in `src/styles.css`:

```css
:root {
  --radius-none: 0px;
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 20px;
  --radius-pill: 1000px;
}
```

Every component references these tokens. Changing a value here updates the entire UI.

### Hotel Data Pipeline

Raw hotel data comes from two IHG API response files:
- `src/assets/hotels-new.json` — hotel info (GraphQL response)
- `src/assets/hotels-new-rates.json` — pricing data

The merge script (`scripts/merge-hotels.js`) transforms these into the app's format:

```bash
node scripts/merge-hotels.js
# Outputs: src/assets/hotels.json (70 hotels)
```

The script handles:
- Brand code → brand name mapping
- Photo ordering (welcome photo first)
- Amenity/facility mapping
- Sentiment generation (NYC, Manhattan, Times Square, etc.)
- Badge extraction (New Hotel, Sustainable Practices)
- Rate extraction (lowest cash rate + fees)

### Brand Configuration

Defined in `src/app/models/brand-config.ts`:

| Brand | Color | Logo |
|---|---|---|
| Kimpton | `#000000` | `kimpton-logo.png` |
| voco | `#F8B90D` | `voco-logo.png` |
| InterContinental | `#956652` | `intercontinental-logo.png` |
| Holiday Inn | `#216245` | `holiday-inn-logo.png` |
| Holiday Inn Express | `#002D72` | `Brand=Holiday Inn Express.svg` |
| Crowne Plaza | `#1B3A6B` | `Brand=Crowne Plaza.svg` |
| Indigo | `#00263A` | `Brand=Indigo.svg` |
| Candlewood | `#9B2242` | `Brand=Candlewood.svg` |
| Independent | `#1F4456` | `independent-logo.png` |

To add a new brand:
1. Add the brand name to the `Hotel.brand` union type in `hotel.model.ts`
2. Add color + logo path to `brand-config.ts`
3. Add chain code mapping in `scripts/merge-hotels.js`
4. Drop the logo file in `src/assets/` or `src/assets/logos/`

### Map & Clustering

- Map uses Leaflet with CartoDB light tiles (no labels on landing, with labels on main map)
- Hotel markers are custom `divIcon` elements with brand color, logo, and price
- `leaflet.markercluster` groups nearby markers — clusters dissolve at zoom level 14+
- Cluster radius: 30px
- Landing page has a static decorative map with pulsing dots at hotel locations worldwide

### Pricing Service

`PricingService` manages cash/points display globally:

```typescript
// Switch mode
pricing.setMode('points');  // or 'cash'

// Format prices
pricing.formatRate(200);        // "25,000 pts" or "200 USD"
pricing.formatRateNumber(200);  // "25,000" or "200"
pricing.toPoints(200);          // 25000
pricing.unitLabel;              // "pts / night" or "USD / night"
```

Components subscribe to `pricing.mode$` to react to changes. The map component re-renders all markers on mode change.

### Environment Variables

Set in `.env` at project root:

```
GEMINI_API_KEY=your_gemini_api_key
PASSWORD_PROTECTED=false
APP_PASSWORD=
```

### NPM Scripts

| Script | Description |
|---|---|
| `npm run start:dev` | Run API server + Angular dev server |
| `npm run start:dev:mobile` | Same but accessible on local network |
| `npm run build` | Production build |
| `npm run test` | Run Jest tests |
