# IHG Hotel Search — Product & Feature Documentation

This document is intended for the development lead and product owner. It covers every feature, how it works technically, and the full AI prompting and rules system.

---

## Overview

IHG Hotel Search is a conversational AI-powered hotel search experience built in Angular. Users interact with a natural language chat interface to find IHG hotels in New York City. The app is responsive — desktop uses a split/floating panel layout, mobile uses a full-screen chat with a bottom sheet for hotel details.

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
- Sticky footer with "View Rooms" CTA

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

## AI System — Full Details

### Model
- Google Gemini 2.5 Flash
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- Temperature: 0.7
- Response format: `application/json` (enforced via `responseMimeType`)
- Timeout: 30 seconds
- Retries: 2 (with 1s, 2s backoff)

### Fallback
If the API fails or times out, a keyword-based fallback processor runs locally. It extracts locations, brands, amenities, and price ranges from the raw query text and returns a generic message.

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

**Brands:** Kimpton, voco, InterContinental, Holiday Inn, Independent

**Price ranges:** Budget (<$200/night), Mid-range ($200–400/night), Luxury (>$400/night)

---

## Tech Stack

- Angular 17 (standalone components)
- Google Gemini 2.5 Flash (AI)
- Leaflet / Mapbox (map)
- Node.js / Express (local API server for config and hotel data)
- `concurrently` to run API server and Angular dev server together (`npm run start:dev`)
