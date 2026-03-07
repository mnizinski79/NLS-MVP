# Angular Hotel Search Application - Requirements

## Overview
Rebuild the IHG Hotel Search application using Angular 17+ with TypeScript, maintaining all features from the vanilla JavaScript prototype while following enterprise-grade architecture patterns and best practices.

## Project Context
This is a migration from a working vanilla JavaScript prototype (`ihg-demo/`) to a production-ready Angular application. The prototype has validated the UX, AI conversation flow, and core features. This rebuild focuses on scalability, maintainability, and code quality.

## User Stories

### US-1: Landing Page Experience
**As a** user visiting the hotel search application  
**I want** to see an engaging landing page with a background image and clear call-to-action  
**So that** I understand the purpose and can start searching immediately

**Acceptance Criteria:**
1.1. Full-screen landing page displays with background image (`assets/landing-desktop.png`)
1.2. Semi-transparent header (50% opacity) overlays the background
1.3. Semi-transparent input bar (50% opacity) at bottom overlays the background
1.4. Welcome box displays centered with:
   - Welcome message
   - Brief description
   - 3 example queries to guide users
1.5. Background image, header, and welcome box hidden after first message sent
1.6. Smooth transition to split-screen layout after first search

### US-2: Conversational AI Search
**As a** user  
**I want** to search for hotels using natural language  
**So that** I can find hotels without learning complex filters

**Acceptance Criteria:**
2.1. Chat input accepts natural language queries
2.2. AI interprets intent and extracts search criteria (location, amenities, price, brand)
2.3. AI responds with contextual, brief messages (max 4 sentences)
2.4. AI follows "contextual anchoring" principles:
   - Acknowledge & validate user input
   - Anchor to location
   - Bridge unsupported requests to closest attribute
   - Surface results fast
2.5. Thinking animation displays while AI processes query
2.6. Conversation state persists across multiple turns
2.7. AI can answer questions about currently displayed hotels
2.8. AI can refine/filter current results without starting fresh search

### US-3: Desktop Split-Screen Layout
**As a** desktop user (screen width > 1024px)  
**I want** a split-screen interface with chat on left and results on right  
**So that** I can see my conversation and results simultaneously

**Acceptance Criteria:**
3.1. Left panel (33% width) contains:
   - Header with app title
   - Scrollable chat message history
   - Helper tags above input (when results exist)
   - Input field and send button at bottom
3.2. Right panel (67% width) contains:
   - Full-screen Leaflet map as background
   - Floating hotel cards in bottom third
   - Landing image before first search
3.3. Hotel cards display horizontally scrollable (snap scroll)
3.4. Map markers show for each hotel with price pills and brand chiclets
3.5. Clicking hotel card or map marker opens detail drawer (33% width from right)

### US-4: Mobile Responsive Layout
**As a** mobile user (screen width < 1024px)  
**I want** a mobile-optimized interface  
**So that** I can search hotels comfortably on my phone

**Acceptance Criteria:**
4.1. Full-screen chat interface with:
   - Header at top
   - Scrollable chat messages
   - Inline hotel cards (max 3) in chat
   - Helper tags above input (when results exist)
   - Fixed input bar at bottom
4.2. Inline hotel cards are smaller (240px × 300px)
4.3. "View X More" button shows if more than 3 results
4.4. Clicking "View All" opens full-screen map overlay with:
   - Full-screen map
   - Close button (top-right)
   - Floating hotel cards at bottom
4.5. Clicking hotel card opens bottom sheet with details
4.6. iOS keyboard appears when tapping input field
4.7. Input field has mobile-optimized attributes (autocomplete, autocorrect, autocapitalize)

### US-5: Hotel Cards Display
**As a** user  
**I want** to see hotel information in visually appealing cards  
**So that** I can quickly compare options

**Acceptance Criteria:**
5.1. Each card displays:
   - Hero image (from hotel.imageUrls[0])
   - Star rating overlay (top-left)
   - Brand chiclet with logo (top-right, circular, brand color background)
   - Hotel name
   - Nightly rate with breakdown (room + fees)
5.2. Desktop cards: 280px × 340px (min-height, expands to fit content)
5.3. Mobile cards: 240px × 300px
5.4. Cards have hover effect (shadow increase)
5.5. Cards are clickable to open details
5.6. Horizontal scroll with snap-to-card behavior
5.7. Brand chiclets use actual logo images with brand colors:
   - Kimpton: #000000 (black)
   - Voco: #F8B90D (yellow/gold)
   - InterContinental: #956652 (brown/copper)
   - Holiday Inn: #216245 (green)
   - Independent: #1F4456 (dark teal)

### US-6: Interactive Map
**As a** user  
**I want** to see hotels on an interactive map  
**So that** I can understand their locations visually

**Acceptance Criteria:**
6.1. Leaflet map displays NYC area (centered on 40.7128, -74.0060, zoom 12)
6.2. Custom map markers for each hotel showing:
   - Brand color background pill
   - Brand logo chiclet (28px, left side)
   - Nightly rate (right side)
6.3. Clicking marker highlights corresponding card
6.4. Map updates when results change
6.5. Map markers only show for currently filtered hotels
6.6. Three map instances:
   - Desktop right panel
   - Mobile "View All" overlay
   - (Landing image shows before first search on desktop)

### US-7: Hotel Detail View
**As a** user  
**I want** to see comprehensive hotel information  
**So that** I can make an informed decision

**Acceptance Criteria:**
7.1. Desktop: Detail drawer slides in from right (33% width)
7.2. Mobile: Bottom sheet slides up from bottom (max 90vh)
7.3. Detail view displays:
   - Hotel name in header
   - Close button
   - Image gallery (all imageUrls)
   - Full description
   - Complete amenities list
   - Location address
   - Rating and brand
   - Pricing breakdown
   - Brand chiclet with logo and name
   - Phone number
7.4. Clicking outside or close button dismisses detail view
7.5. Detail view scrollable if content exceeds viewport

### US-8: Auto-Open Single Result
**As a** user on a screen wider than 1000px  
**I want** hotel details to open automatically when there's only one result  
**So that** I can see full information immediately

**Acceptance Criteria:**
8.1. When exactly 1 hotel is returned AND screen width > 1000px:
   - Hotel card displays normally
   - Detail drawer opens automatically after 300ms
8.2. Auto-open does NOT trigger on mobile or screens ≤1000px
8.3. User can still close detail drawer manually

### US-9: Date Selection
**As a** user  
**I want** to select check-in and check-out dates  
**So that** I can see accurate pricing and availability

**Acceptance Criteria:**
9.1. When ≤3 results, AI prompts for dates with specific messages:
   - 1 result: "Interested in this one? Add your dates to see live pricing and availability."
   - 2 results: "You're down to just 2 options — do you have dates in mind so I can show you accurate pricing?"
   - 3 results: "You're down to just 3 options — do you have dates in mind so I can show you accurate pricing?"
9.2. Desktop: "Select Dates →" button appears below AI message
9.3. Mobile: "Select Dates →" button appears below inline hotel cards
9.4. Clicking button shows inline date picker in chat (not modal)
9.5. Date picker displays:
   - Flatpickr calendar in range mode
   - Guest count dropdown (1-5+ guests)
   - Cancel and Apply buttons
9.6. Applying dates sends message: "I'd like to book from [date] to [date] for [X] guest(s)"
9.7. AI confirms dates without re-searching: "Perfect! I've updated your search for [dates]. The pricing shown is estimated — I'll have exact rates once you're ready to book."
9.8. Dates stored in conversation state for reference

### US-10: Helper Tags (Refinement Suggestions)
**As a** user with search results  
**I want** to see suggested refinements as clickable pills  
**So that** I can easily narrow down my options

**Acceptance Criteria:**
10.1. Helper tags appear above input field ONLY after results are displayed
10.2. Tags are dynamically generated from current filtered results:
   - Up to 3 amenity tags (e.g., "🍸 Rooftop Bar", "💪 Fitness Center")
   - Up to 2 location tags if multiple locations (e.g., "🏢 Near Times Square")
10.3. Each tag is a pill-shaped button with:
   - Icon emoji
   - Text label
   - Gray background (bg-gray-100)
   - Hover effect (bg-gray-200)
   - Rounded full shape
10.4. Clicking tag fills input and sends query:
   - Amenity: "which ones have [amenity]"
   - Location: "show me hotels near [location]"
10.5. Tags update with each new search result
10.6. Tags hidden if no results
10.7. Horizontal scrolling if tags overflow

### US-11: AI Intent Classification
**As a** system  
**I want** to classify user intent accurately  
**So that** I can provide appropriate responses and results

**Acceptance Criteria:**
11.1. System recognizes 11 intent types:
   - location_only
   - preferences_only
   - complete_query
   - vague
   - unsupported
   - show_results_now
   - show_all
   - cheapest
   - most_expensive
   - hotel_info
   - refine_search
11.2. Each intent has specific handling logic
11.3. "show_all" returns all hotels without filters
11.4. "cheapest"/"most_expensive" returns exactly 1 hotel after sorting
11.5. "hotel_info" answers questions about displayed hotels without new search
11.6. "refine_search" filters current results, not all hotels
11.7. Intent history tracked for pattern detection

### US-12: Search Filtering
**As a** system  
**I want** to filter hotels based on extracted criteria  
**So that** users see relevant results

**Acceptance Criteria:**
12.1. Filter by location/sentiment (Times Square, Midtown, Broadway, etc.)
12.2. Filter by brand (Kimpton, InterContinental, Holiday Inn, voco, Independent)
12.3. Filter by amenities (Rooftop Bar, Fitness Center, Pet Friendly, etc.)
12.4. Filter by price range (min/max)
12.5. Filter by minimum rating
12.6. Sort by price (asc/desc) or rating (desc)
12.7. Filters applied in order: brand → sentiment → price → amenities → rating → sort
12.8. Multiple amenities use OR logic (hotel must have at least one)
12.9. Multiple sentiments use OR logic
12.10. Refine search starts with currentHotels, not all hotels

### US-13: Conversation State Management
**As a** system  
**I want** to maintain conversation state across turns  
**So that** I can provide context-aware responses

**Acceptance Criteria:**
13.1. State object tracks:
   - hasLocation, hasPreferences, resultCount
   - conversationContext (location, brands, sentiments, amenities, priceRange, minRating)
   - lastIntent, intentHistory
   - turnCount, lastQuery, lastResponse
   - lastDisplayedHotels (full hotel objects)
13.2. State updates after each AI response
13.3. lastDisplayedHotels enables context-aware refinement
13.4. State cleared on page refresh (no persistence)
13.5. State used to build context for AI prompts

### US-14: Error Handling & Fallback
**As a** system  
**I want** to gracefully handle errors  
**So that** users always get a response

**Acceptance Criteria:**
14.1. Fallback to basic keyword processing if:
   - API key unavailable
   - API request fails
   - JSON parsing fails
   - Response timeout (30s)
14.2. Basic processing uses keyword matching for:
   - Location
   - Brand names
   - Amenities
   - Price keywords
14.3. All errors logged with context
14.4. No errors exposed to user
14.5. Generic response templates used as fallback

### US-15: Performance & Optimization
**As a** user  
**I want** fast, responsive interactions  
**So that** I have a smooth experience

**Acceptance Criteria:**
15.1. Initial page load < 2 seconds
15.2. AI response time < 3 seconds (excluding API latency)
15.3. Map renders within 500ms
15.4. Smooth animations (60fps)
15.5. Lazy load hotel images
15.6. Debounce rapid queries
15.7. Cancel in-flight requests when new query submitted

## Technical Requirements

### Architecture
- Angular 17+ with standalone components
- TypeScript strict mode
- Reactive state management (RxJS)
- Service-based architecture
- Component-based UI
- Lazy loading for routes (if multi-page)

### Styling
- Tailwind CSS 3+
- Inter font family
- Responsive breakpoint: 1024px (lg)
- Custom color palette:
  - primary: #1a1a1a
  - primary-light: #2d2d2d
  - accent: #404040

### External Libraries
- Leaflet for maps (@asymmetrik/ngx-leaflet)
- Flatpickr for date picker
- Google Material Symbols for icons

### API Integration
- Google Gemini AI (gemini-2.5-flash)
- JSON response mode
- Temperature: 0.7
- API key from environment variable
- Server endpoint for config: `/api/config`

### Data Models
- Hotel interface with all properties
- ConversationState interface
- SearchCriteria interface
- AIResponse interface
- FilterOptions interface

### Services
- AIService (Gemini API integration)
- HotelService (filtering, sorting)
- ConversationService (state management)
- MapService (Leaflet integration)
- DateService (date picker logic)

### Components
- AppComponent (root)
- LandingComponent (initial view)
- ChatComponent (message display)
- InputComponent (message input + helper tags)
- HotelCardComponent (reusable card)
- HotelDetailComponent (drawer/bottom sheet)
- MapComponent (Leaflet wrapper)
- DatePickerComponent (inline picker)
- ThinkingAnimationComponent (loading dots)

### Testing
- Unit tests for all services (Jest)
- Component tests for UI components
- Property-based tests for filtering logic (fast-check)
- E2E tests for critical user flows
- Minimum 80% code coverage

### Security
- API key never exposed in client code
- Environment variables for sensitive config
- Input sanitization
- XSS protection (Angular built-in)
- No user data persistence

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader support
- Focus management
- Color contrast ratios ≥4.5:1
- ARIA labels where needed

## Non-Functional Requirements

### Browser Support
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

### Device Support
- Desktop: 1280px+ (primary target)
- Tablet: 768px - 1023px (responsive)
- Mobile: 320px - 767px (responsive)

### Performance Targets
- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Cumulative Layout Shift < 0.1

### Scalability
- Support 100+ hotels in dataset
- Handle 10+ conversation turns
- Maintain performance with large result sets

## Out of Scope (Future Enhancements)
- Real booking integration
- User accounts / authentication
- Conversation persistence
- Multi-language support
- Voice input
- Price prediction
- Collaborative filtering
- A/B testing framework
- Analytics integration

## Success Metrics
- Feature parity with vanilla JS prototype
- All acceptance criteria met
- 80%+ test coverage
- Zero critical accessibility violations
- Lighthouse score > 90
- Clean, maintainable codebase following Angular best practices

## Dependencies
- Existing vanilla JS prototype (`ihg-demo/`)
- AI Conversation Requirements document
- Hotel data JSON file
- Brand logo assets
- Landing page image asset
- Google Gemini API access

## Constraints
- Desktop-first design (per project standards)
- Must use Angular 17+
- Must use TypeScript strict mode
- Must use Tailwind CSS
- Must maintain all features from prototype
- Must follow project coding standards
