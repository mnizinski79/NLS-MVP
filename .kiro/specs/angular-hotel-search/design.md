# Angular Hotel Search Application - Design Document

## Overview

This design document specifies the architecture for rebuilding the IHG Hotel Search application using Angular 17+ with TypeScript. The application provides an AI-powered conversational interface for searching hotels in New York City, featuring natural language processing via Google Gemini AI, interactive Leaflet maps, and a responsive split-screen layout.

The system migrates a validated vanilla JavaScript prototype to a production-ready Angular application with enterprise-grade architecture, emphasizing scalability, maintainability, and testability. The design follows Angular best practices with standalone components, reactive state management using RxJS, and a service-based architecture.

### Key Features
- AI-powered conversational search using Google Gemini
- Interactive Leaflet maps with custom markers
- Responsive design (desktop-first, breakpoint at 1024px)
- Real-time hotel filtering and refinement
- Date selection with pricing updates
- Context-aware conversation state management

### Technology Stack
- Angular 17+ (standalone components)
- TypeScript (strict mode)
- RxJS for reactive state management
- Tailwind CSS for styling
- Leaflet for interactive maps
- Flatpickr for date selection
- Google Gemini AI (gemini-2.5-flash)

## Architecture

### High-Level Architecture

The application follows a layered architecture pattern:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (Components: Landing, Chat, Map, HotelCard, Details)   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     Service Layer                        │
│   (AI, Hotel, Conversation, Map, Date Services)         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                      Data Layer                          │
│        (Models, Interfaces, State Management)            │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    External Services                     │
│              (Google Gemini API, Config API)             │
└─────────────────────────────────────────────────────────┘
```

### Component Hierarchy


```
AppComponent (root)
├── LandingComponent (initial full-screen view)
│   ├── HeaderComponent (semi-transparent overlay)
│   ├── WelcomeBoxComponent (centered welcome message)
│   └── InputBarComponent (bottom overlay)
│
├── DesktopLayoutComponent (width > 1024px)
│   ├── LeftPanelComponent (33% width)
│   │   ├── HeaderComponent
│   │   ├── ChatComponent
│   │   │   ├── MessageComponent (repeated)
│   │   │   └── ThinkingAnimationComponent
│   │   ├── HelperTagsComponent
│   │   └── InputComponent
│   │
│   └── RightPanelComponent (67% width)
│       ├── MapComponent (full-screen background)
│       ├── HotelCardsContainerComponent (bottom third)
│       │   └── HotelCardComponent (repeated, horizontal scroll)
│       └── HotelDetailDrawerComponent (33% width, slides from right)
│
└── MobileLayoutComponent (width ≤ 1024px)
    ├── HeaderComponent
    ├── ChatComponent
    │   ├── MessageComponent (repeated)
    │   ├── InlineHotelCardComponent (max 3)
    │   ├── ViewMoreButtonComponent
    │   └── ThinkingAnimationComponent
    ├── HelperTagsComponent
    ├── InputComponent (fixed bottom)
    ├── MapOverlayComponent (full-screen, toggled)
    │   ├── MapComponent
    │   ├── CloseButtonComponent
    │   └── HotelCardsContainerComponent (bottom)
    └── HotelDetailBottomSheetComponent (slides from bottom)
```

### State Management Strategy

The application uses a reactive state management approach with RxJS:

1. **ConversationService**: Central state store using BehaviorSubjects
   - Manages conversation state, message history, and current results
   - Emits state changes to subscribed components
   - Provides methods for state updates

2. **Component Communication**: 
   - Parent-to-child: Input properties
   - Child-to-parent: Output events
   - Sibling-to-sibling: Shared services with observables

3. **State Flow**:
   ```
   User Input → InputComponent → ConversationService
                                        ↓
                                   AIService
                                        ↓
                                  HotelService
                                        ↓
                              ConversationService (state update)
                                        ↓
                          Components (subscribe to state changes)
   ```

### Responsive Design Strategy

Desktop-first approach with a single breakpoint at 1024px:

- **Desktop (> 1024px)**: Split-screen layout with chat left, map/results right
- **Mobile (≤ 1024px)**: Full-screen chat with inline cards, map overlay on demand

Tailwind's `lg:` prefix used for desktop-specific styles.

## Components and Interfaces

### Core Components

#### AppComponent
**Purpose**: Root component, handles layout switching based on viewport width

**Responsibilities**:
- Detect viewport width changes
- Toggle between desktop and mobile layouts
- Initialize application services
- Load hotel data on startup

**Inputs**: None

**Outputs**: None

**State**: 
- `isMobile$: Observable<boolean>` - Reactive viewport width detection

**Key Methods**:
- `ngOnInit()`: Initialize services, load hotel data
- `checkViewport()`: Determine layout based on window.innerWidth



#### LandingComponent
**Purpose**: Display full-screen landing page before first search

**Responsibilities**:
- Show background image with overlays
- Display welcome message and example queries
- Hide after first message sent
- Smooth transition to main layout

**Inputs**:
- `visible: boolean` - Controls visibility

**Outputs**:
- `dismissed: EventEmitter<void>` - Emitted when landing dismissed

**State**:
- `exampleQueries: string[]` - Predefined example queries

**Key Methods**:
- `onFirstMessage()`: Hide landing, emit dismissed event

#### ChatComponent
**Purpose**: Display conversation history with AI and user messages

**Responsibilities**:
- Render message list with proper styling
- Auto-scroll to latest message
- Display thinking animation during AI processing
- Handle inline hotel cards (mobile)
- Show date picker inline when triggered

**Inputs**:
- `messages: Message[]` - Array of conversation messages
- `isThinking: boolean` - Show/hide thinking animation
- `isMobile: boolean` - Layout mode

**Outputs**: None

**State**:
- `scrollContainer: ElementRef` - Reference for auto-scroll

**Key Methods**:
- `scrollToBottom()`: Smooth scroll to latest message
- `ngAfterViewChecked()`: Auto-scroll on new messages

#### InputComponent
**Purpose**: Handle user input and message submission

**Responsibilities**:
- Accept text input
- Send button with disabled state
- Emit message on submit
- Clear input after send
- Mobile keyboard optimization

**Inputs**:
- `disabled: boolean` - Disable during AI processing
- `placeholder: string` - Input placeholder text

**Outputs**:
- `messageSent: EventEmitter<string>` - Emitted with user message

**State**:
- `inputValue: string` - Current input text

**Key Methods**:
- `onSubmit()`: Validate and emit message
- `clearInput()`: Reset input field

#### HelperTagsComponent
**Purpose**: Display dynamic refinement suggestions as clickable pills

**Responsibilities**:
- Generate tags from current results
- Display up to 3 amenity tags and 2 location tags
- Handle tag clicks
- Horizontal scroll for overflow
- Hide when no results

**Inputs**:
- `hotels: Hotel[]` - Current filtered hotels
- `visible: boolean` - Show/hide tags

**Outputs**:
- `tagClicked: EventEmitter<string>` - Emitted with query text

**State**:
- `amenityTags: Tag[]` - Generated amenity tags
- `locationTags: Tag[]` - Generated location tags

**Key Methods**:
- `generateTags()`: Create tags from hotel data
- `onTagClick(tag: Tag)`: Emit query for tag



#### HotelCardComponent
**Purpose**: Reusable hotel card display (desktop and mobile variants)

**Responsibilities**:
- Display hotel image, name, rating, price
- Show brand chiclet with logo
- Handle click to open details
- Hover effects (desktop)
- Responsive sizing

**Inputs**:
- `hotel: Hotel` - Hotel data
- `variant: 'desktop' | 'mobile'` - Card size variant
- `highlighted: boolean` - Visual highlight state

**Outputs**:
- `cardClicked: EventEmitter<Hotel>` - Emitted when card clicked

**State**: None (pure presentation)

**Key Methods**:
- `onClick()`: Emit card clicked event
- `getBrandColor()`: Return brand-specific color
- `formatPrice()`: Format price with breakdown

#### HotelDetailDrawerComponent (Desktop)
**Purpose**: Slide-in drawer showing full hotel details

**Responsibilities**:
- Slide in from right (33% width)
- Display comprehensive hotel information
- Image gallery
- Close on outside click or close button
- Scrollable content

**Inputs**:
- `hotel: Hotel | null` - Hotel to display
- `visible: boolean` - Show/hide drawer

**Outputs**:
- `closed: EventEmitter<void>` - Emitted when drawer closed

**State**:
- `currentImageIndex: number` - Gallery navigation

**Key Methods**:
- `close()`: Emit closed event
- `nextImage()`: Navigate gallery
- `previousImage()`: Navigate gallery

#### HotelDetailBottomSheetComponent (Mobile)
**Purpose**: Bottom sheet showing full hotel details

**Responsibilities**:
- Slide up from bottom (max 90vh)
- Display comprehensive hotel information
- Image gallery
- Close on swipe down or close button
- Scrollable content

**Inputs**:
- `hotel: Hotel | null` - Hotel to display
- `visible: boolean` - Show/hide sheet

**Outputs**:
- `closed: EventEmitter<void>` - Emitted when sheet closed

**State**:
- `currentImageIndex: number` - Gallery navigation
- `touchStartY: number` - Swipe gesture tracking

**Key Methods**:
- `close()`: Emit closed event
- `onTouchStart(event)`: Track swipe start
- `onTouchEnd(event)`: Detect swipe down to close

#### MapComponent
**Purpose**: Leaflet map wrapper with custom markers

**Responsibilities**:
- Initialize Leaflet map
- Display custom hotel markers
- Handle marker clicks
- Update markers when hotels change
- Center map on results

**Inputs**:
- `hotels: Hotel[]` - Hotels to display as markers
- `center: [number, number]` - Map center coordinates
- `zoom: number` - Map zoom level

**Outputs**:
- `markerClicked: EventEmitter<Hotel>` - Emitted when marker clicked

**State**:
- `map: L.Map` - Leaflet map instance
- `markers: L.Marker[]` - Current markers

**Key Methods**:
- `initMap()`: Initialize Leaflet map
- `updateMarkers()`: Refresh markers based on hotels
- `createCustomMarker(hotel)`: Create marker with brand styling
- `centerOnHotels()`: Adjust map bounds to fit all markers



#### DatePickerComponent
**Purpose**: Inline date range picker with guest selection

**Responsibilities**:
- Display Flatpickr calendar in range mode
- Guest count dropdown (1-5+)
- Cancel and Apply buttons
- Emit selected dates and guest count
- Inline display in chat (not modal)

**Inputs**:
- `visible: boolean` - Show/hide picker

**Outputs**:
- `datesSelected: EventEmitter<DateSelection>` - Emitted with dates and guests
- `cancelled: EventEmitter<void>` - Emitted when cancelled

**State**:
- `checkIn: Date | null` - Selected check-in date
- `checkOut: Date | null` - Selected check-out date
- `guestCount: number` - Selected guest count

**Key Methods**:
- `initFlatpickr()`: Initialize date picker
- `onApply()`: Validate and emit selection
- `onCancel()`: Emit cancelled event

#### ThinkingAnimationComponent
**Purpose**: Display animated dots while AI processes

**Responsibilities**:
- Show three animated dots
- Smooth fade in/out
- Consistent styling with chat messages

**Inputs**:
- `visible: boolean` - Show/hide animation

**Outputs**: None

**State**: None (pure presentation)

**Key Methods**: None (CSS animation)

### Service Layer

#### AIService
**Purpose**: Handle Google Gemini AI integration

**Responsibilities**:
- Send queries to Gemini API
- Parse JSON responses
- Handle API errors and timeouts
- Fallback to keyword processing
- Build context from conversation state

**Key Methods**:
```typescript
processQuery(
  query: string, 
  conversationState: ConversationState
): Observable<AIResponse>

buildPrompt(
  query: string, 
  state: ConversationState
): string

parseResponse(
  apiResponse: string
): AIResponse

fallbackProcessing(
  query: string
): AIResponse
```

**Dependencies**:
- HttpClient for API calls
- ConfigService for API key

**Error Handling**:
- Timeout after 30 seconds
- Retry logic (max 2 retries)
- Fallback to keyword matching
- All errors logged, never exposed to user



#### HotelService
**Purpose**: Hotel data management, filtering, and sorting

**Responsibilities**:
- Load hotel data from JSON
- Filter hotels by multiple criteria
- Sort hotels by price or rating
- Handle refinement vs. new search logic
- Provide hotel lookup by ID

**Key Methods**:
```typescript
loadHotels(): Observable<Hotel[]>

filterHotels(
  hotels: Hotel[],
  criteria: SearchCriteria
): Hotel[]

filterByBrand(
  hotels: Hotel[],
  brands: string[]
): Hotel[]

filterBySentiment(
  hotels: Hotel[],
  sentiments: string[]
): Hotel[]

filterByAmenities(
  hotels: Hotel[],
  amenities: string[]
): Hotel[]

filterByPrice(
  hotels: Hotel[],
  min?: number,
  max?: number
): Hotel[]

filterByRating(
  hotels: Hotel[],
  minRating: number
): Hotel[]

sortHotels(
  hotels: Hotel[],
  sortBy: 'price_asc' | 'price_desc' | 'rating_desc'
): Hotel[]

getHotelById(id: string): Hotel | undefined
```

**Dependencies**: HttpClient for loading data

**Filter Order**: brand → sentiment → price → amenities → rating → sort

**Refinement Logic**: When refining, start with `currentHotels` instead of all hotels

#### ConversationService
**Purpose**: Manage conversation state and message history

**Responsibilities**:
- Maintain conversation state
- Store message history
- Track last displayed hotels
- Update state after each turn
- Provide state observables for components

**State Properties**:
```typescript
private conversationState$ = new BehaviorSubject<ConversationState>({
  hasLocation: false,
  hasPreferences: false,
  resultCount: 0,
  conversationContext: {
    location: null,
    brands: [],
    sentiments: [],
    amenities: [],
    priceRange: { min: null, max: null },
    minRating: null
  },
  lastIntent: null,
  intentHistory: [],
  turnCount: 0,
  lastQuery: null,
  lastResponse: null,
  lastDisplayedHotels: []
});

private messages$ = new BehaviorSubject<Message[]>([]);
```

**Key Methods**:
```typescript
getState(): Observable<ConversationState>

updateState(updates: Partial<ConversationState>): void

addMessage(message: Message): void

getMessages(): Observable<Message[]>

clearConversation(): void

getLastDisplayedHotels(): Hotel[]
```

**Dependencies**: None (pure state management)



#### MapService
**Purpose**: Leaflet map utilities and marker creation

**Responsibilities**:
- Create custom markers with brand styling
- Calculate map bounds for hotel sets
- Generate marker HTML with brand chiclets
- Provide map configuration

**Key Methods**:
```typescript
createCustomMarker(
  hotel: Hotel,
  onClick: (hotel: Hotel) => void
): L.Marker

getMarkerHtml(hotel: Hotel): string

calculateBounds(hotels: Hotel[]): L.LatLngBounds

getDefaultMapOptions(): L.MapOptions
```

**Dependencies**: Leaflet library

**Marker Design**:
- Brand color background pill
- Brand logo chiclet (28px, left side)
- Nightly rate (right side)
- Clickable with hover effect

#### DateService
**Purpose**: Date picker configuration and formatting

**Responsibilities**:
- Configure Flatpickr options
- Format dates for display
- Validate date ranges
- Calculate night count

**Key Methods**:
```typescript
getFlatpickrOptions(): FlatpickrOptions

formatDateRange(
  checkIn: Date,
  checkOut: Date
): string

validateDateRange(
  checkIn: Date,
  checkOut: Date
): boolean

calculateNights(
  checkIn: Date,
  checkOut: Date
): number
```

**Dependencies**: Flatpickr library

**Validation Rules**:
- Check-in must be today or future
- Check-out must be after check-in
- Maximum stay: 30 nights

#### ConfigService
**Purpose**: Load application configuration from server

**Responsibilities**:
- Fetch API key from `/api/config`
- Cache configuration
- Provide configuration observables

**Key Methods**:
```typescript
loadConfig(): Observable<AppConfig>

getApiKey(): string | null
```

**Dependencies**: HttpClient

**Security**: API key never exposed in client code, loaded from server endpoint

## Data Models

### Core Interfaces

#### Hotel
```typescript
interface Hotel {
  id: string;
  name: string;
  brand: 'Kimpton' | 'voco' | 'InterContinental' | 'Holiday Inn' | 'Independent';
  rating: number; // 1-5 stars
  location: {
    address: string;
    neighborhood: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  pricing: {
    nightlyRate: number;
    roomRate: number;
    fees: number;
  };
  amenities: string[]; // e.g., "Rooftop Bar", "Fitness Center"
  description: string;
  imageUrls: string[];
  phone: string;
  sentiment: string[]; // e.g., "Times Square", "Midtown", "Broadway"
}
```



#### ConversationState
```typescript
interface ConversationState {
  hasLocation: boolean;
  hasPreferences: boolean;
  resultCount: number;
  conversationContext: {
    location: string | null;
    brands: string[];
    sentiments: string[];
    amenities: string[];
    priceRange: {
      min: number | null;
      max: number | null;
    };
    minRating: number | null;
  };
  lastIntent: IntentType | null;
  intentHistory: IntentType[];
  turnCount: number;
  lastQuery: string | null;
  lastResponse: string | null;
  lastDisplayedHotels: Hotel[];
}
```

#### SearchCriteria
```typescript
interface SearchCriteria {
  brands?: string[];
  sentiments?: string[];
  amenities?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  minRating?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating_desc';
}
```

#### AIResponse
```typescript
interface AIResponse {
  intent: IntentType;
  message: string;
  searchCriteria?: SearchCriteria;
  shouldSearch: boolean;
  shouldRefine: boolean;
  specificHotelId?: string;
}
```

#### IntentType
```typescript
type IntentType = 
  | 'location_only'
  | 'preferences_only'
  | 'complete_query'
  | 'vague'
  | 'unsupported'
  | 'show_results_now'
  | 'show_all'
  | 'cheapest'
  | 'most_expensive'
  | 'hotel_info'
  | 'refine_search';
```

#### Message
```typescript
interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  hotels?: Hotel[]; // For AI messages with results
  showDatePicker?: boolean; // Trigger date picker display
}
```

#### Tag
```typescript
interface Tag {
  type: 'amenity' | 'location';
  label: string;
  icon: string;
  query: string;
}
```

#### DateSelection
```typescript
interface DateSelection {
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
}
```

#### AppConfig
```typescript
interface AppConfig {
  geminiApiKey: string;
}
```

### Brand Configuration

```typescript
const BRAND_COLORS: Record<string, string> = {
  'Kimpton': '#000000',
  'voco': '#F8B90D',
  'InterContinental': '#956652',
  'Holiday Inn': '#216245',
  'Independent': '#1F4456'
};

const BRAND_LOGOS: Record<string, string> = {
  'Kimpton': 'assets/logos/kimpton.svg',
  'voco': 'assets/logos/voco.svg',
  'InterContinental': 'assets/logos/intercontinental.svg',
  'Holiday Inn': 'assets/logos/holiday-inn.svg',
  'Independent': 'assets/logos/independent.svg'
};
```



### Intent Handling Logic

Each intent type has specific handling:

1. **location_only**: Acknowledge location, prompt for preferences
2. **preferences_only**: Acknowledge preferences, prompt for location
3. **complete_query**: Execute search with extracted criteria
4. **vague**: Ask clarifying questions
5. **unsupported**: Bridge to closest supported attribute
6. **show_results_now**: Return current results without new search
7. **show_all**: Return all hotels without filters
8. **cheapest**: Sort by price ascending, return first hotel
9. **most_expensive**: Sort by price descending, return first hotel
10. **hotel_info**: Answer questions about displayed hotels
11. **refine_search**: Filter current results, not all hotels

## AI Integration Design

### Prompt Engineering

The AI prompt includes:
- System instructions for conversational style
- Current conversation context
- Last displayed hotels (for refinement)
- User query
- Expected JSON response format

**Prompt Template**:
```
You are a helpful hotel search assistant for IHG properties in New York City.

Conversation Context:
- Location: {location}
- Previous results: {resultCount} hotels
- Last intent: {lastIntent}

Last Displayed Hotels:
{hotelNames}

User Query: {query}

Respond with JSON:
{
  "intent": "...",
  "message": "...",
  "searchCriteria": {...},
  "shouldSearch": true/false,
  "shouldRefine": true/false
}

Guidelines:
- Keep messages brief (max 4 sentences)
- Use contextual anchoring
- Acknowledge user input
- Bridge unsupported requests
- Surface results fast
```

### Response Processing

1. Parse JSON response from Gemini
2. Validate intent and criteria
3. Execute search or refinement if needed
4. Update conversation state
5. Add AI message to chat
6. Display results

### Fallback Processing

If AI fails, use keyword matching:
- Extract location keywords (Times Square, Midtown, etc.)
- Extract brand names
- Extract amenity keywords
- Extract price keywords (cheap, expensive, under $X)
- Build SearchCriteria from matches
- Return generic response template

### Error Handling

- API timeout: 30 seconds
- Retry logic: Max 2 retries with exponential backoff
- JSON parse errors: Fallback to keyword processing
- Network errors: Show generic error, use fallback
- All errors logged with context



## Filtering and Search Logic

### Filter Pipeline

Filters applied in strict order:

```typescript
function filterHotels(hotels: Hotel[], criteria: SearchCriteria): Hotel[] {
  let filtered = hotels;
  
  // 1. Brand filter
  if (criteria.brands?.length) {
    filtered = filterByBrand(filtered, criteria.brands);
  }
  
  // 2. Sentiment filter (location/neighborhood)
  if (criteria.sentiments?.length) {
    filtered = filterBySentiment(filtered, criteria.sentiments);
  }
  
  // 3. Price range filter
  if (criteria.priceRange) {
    filtered = filterByPrice(
      filtered, 
      criteria.priceRange.min, 
      criteria.priceRange.max
    );
  }
  
  // 4. Amenities filter (OR logic)
  if (criteria.amenities?.length) {
    filtered = filterByAmenities(filtered, criteria.amenities);
  }
  
  // 5. Rating filter
  if (criteria.minRating) {
    filtered = filterByRating(filtered, criteria.minRating);
  }
  
  // 6. Sort
  if (criteria.sortBy) {
    filtered = sortHotels(filtered, criteria.sortBy);
  }
  
  return filtered;
}
```

### Filter Implementations

**Brand Filter**:
```typescript
function filterByBrand(hotels: Hotel[], brands: string[]): Hotel[] {
  return hotels.filter(h => brands.includes(h.brand));
}
```

**Sentiment Filter** (OR logic):
```typescript
function filterBySentiment(hotels: Hotel[], sentiments: string[]): Hotel[] {
  return hotels.filter(h => 
    h.sentiment.some(s => sentiments.includes(s))
  );
}
```

**Amenities Filter** (OR logic):
```typescript
function filterByAmenities(hotels: Hotel[], amenities: string[]): Hotel[] {
  return hotels.filter(h =>
    amenities.some(a => h.amenities.includes(a))
  );
}
```

**Price Filter**:
```typescript
function filterByPrice(
  hotels: Hotel[], 
  min?: number, 
  max?: number
): Hotel[] {
  return hotels.filter(h => {
    const price = h.pricing.nightlyRate;
    if (min !== undefined && price < min) return false;
    if (max !== undefined && price > max) return false;
    return true;
  });
}
```

**Rating Filter**:
```typescript
function filterByRating(hotels: Hotel[], minRating: number): Hotel[] {
  return hotels.filter(h => h.rating >= minRating);
}
```

**Sort**:
```typescript
function sortHotels(
  hotels: Hotel[], 
  sortBy: 'price_asc' | 'price_desc' | 'rating_desc'
): Hotel[] {
  const sorted = [...hotels];
  
  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => 
        a.pricing.nightlyRate - b.pricing.nightlyRate
      );
    case 'price_desc':
      return sorted.sort((a, b) => 
        b.pricing.nightlyRate - a.pricing.nightlyRate
      );
    case 'rating_desc':
      return sorted.sort((a, b) => b.rating - a.rating);
    default:
      return sorted;
  }
}
```

### Refinement vs. New Search

**New Search**: Start with all hotels
```typescript
const results = filterHotels(allHotels, criteria);
```

**Refinement**: Start with current results
```typescript
const results = filterHotels(currentHotels, criteria);
```

Decision logic:
- If `shouldRefine === true` in AI response → use current hotels
- If intent is `refine_search` → use current hotels
- Otherwise → use all hotels



## Helper Tags Generation

Helper tags are dynamically generated from current results:

```typescript
function generateHelperTags(hotels: Hotel[]): Tag[] {
  const tags: Tag[] = [];
  
  // Count amenity occurrences
  const amenityCounts = new Map<string, number>();
  hotels.forEach(h => {
    h.amenities.forEach(a => {
      amenityCounts.set(a, (amenityCounts.get(a) || 0) + 1);
    });
  });
  
  // Get top 3 amenities
  const topAmenities = Array.from(amenityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([amenity]) => ({
      type: 'amenity',
      label: amenity,
      icon: getAmenityIcon(amenity),
      query: `which ones have ${amenity}`
    }));
  
  tags.push(...topAmenities);
  
  // Get unique locations (up to 2)
  const locations = new Set<string>();
  hotels.forEach(h => {
    h.sentiment.forEach(s => locations.add(s));
  });
  
  if (locations.size > 1) {
    const locationTags = Array.from(locations)
      .slice(0, 2)
      .map(loc => ({
        type: 'location',
        label: `Near ${loc}`,
        icon: '🏢',
        query: `show me hotels near ${loc}`
      }));
    
    tags.push(...locationTags);
  }
  
  return tags;
}
```

**Amenity Icon Mapping**:
```typescript
const AMENITY_ICONS: Record<string, string> = {
  'Rooftop Bar': '🍸',
  'Fitness Center': '💪',
  'Pet Friendly': '🐕',
  'Pool': '🏊',
  'Spa': '💆',
  'Restaurant': '🍽️',
  'Free WiFi': '📶',
  'Parking': '🅿️'
};
```

## Date Selection Flow

### Trigger Conditions

Date picker shown when:
- Result count ≤ 3
- AI includes `showDatePicker: true` in response

### AI Prompts by Result Count

- 1 result: "Interested in this one? Add your dates to see live pricing and availability."
- 2 results: "You're down to just 2 options — do you have dates in mind so I can show you accurate pricing?"
- 3 results: "You're down to just 3 options — do you have dates in mind so I can show you accurate pricing?"

### Date Picker Display

**Desktop**: Button appears below AI message
**Mobile**: Button appears below inline hotel cards

### User Flow

1. User clicks "Select Dates →" button
2. Date picker displays inline in chat
3. User selects date range and guest count
4. User clicks "Apply"
5. System sends message: "I'd like to book from [date] to [date] for [X] guest(s)"
6. AI confirms: "Perfect! I've updated your search for [dates]. The pricing shown is estimated — I'll have exact rates once you're ready to book."
7. Dates stored in conversation state

### Date Validation

- Check-in must be today or future
- Check-out must be after check-in
- Maximum stay: 30 nights
- Show error message for invalid selections



## Auto-Open Single Result

When exactly 1 hotel is returned AND screen width > 1000px:

```typescript
function handleSearchResults(hotels: Hotel[], screenWidth: number): void {
  if (hotels.length === 1 && screenWidth > 1000) {
    setTimeout(() => {
      openHotelDetail(hotels[0]);
    }, 300);
  }
}
```

This provides immediate detail view for single results on desktop, improving UX by reducing clicks.

## Responsive Breakpoints

Single breakpoint at 1024px using Tailwind's `lg:` prefix:

```typescript
// Viewport detection
const isMobile$ = fromEvent(window, 'resize').pipe(
  startWith(null),
  map(() => window.innerWidth <= 1024),
  distinctUntilChanged(),
  shareReplay(1)
);
```

**Desktop Styles** (> 1024px):
- Split-screen layout
- Larger hotel cards (280px × 340px)
- Horizontal card scroll
- Detail drawer (33% width)
- Full-screen map background

**Mobile Styles** (≤ 1024px):
- Full-screen chat
- Smaller inline cards (240px × 300px)
- Max 3 cards inline
- "View All" button for map overlay
- Bottom sheet for details

## Animation and Transitions

### Landing to Main Layout
```css
.landing-exit {
  animation: fadeOut 0.5s ease-out;
}

.main-enter {
  animation: fadeIn 0.5s ease-in;
}
```

### Detail Drawer (Desktop)
```css
.drawer-enter {
  transform: translateX(100%);
  animation: slideInRight 0.3s ease-out forwards;
}

.drawer-exit {
  animation: slideOutRight 0.3s ease-in forwards;
}
```

### Bottom Sheet (Mobile)
```css
.sheet-enter {
  transform: translateY(100%);
  animation: slideUp 0.3s ease-out forwards;
}

.sheet-exit {
  animation: slideDown 0.3s ease-in forwards;
}
```

### Thinking Animation
```css
.thinking-dot {
  animation: bounce 1.4s infinite ease-in-out;
}

.thinking-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-dot:nth-child(2) {
  animation-delay: -0.16s;
}
```

### Card Hover (Desktop)
```css
.hotel-card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  transition: all 0.2s ease;
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:

- **Filtering properties (12.1-12.5)** can be combined into a comprehensive filter correctness property
- **Intent handling (11.2-11.6)** can be consolidated into intent-specific behavior properties
- **UI interaction properties (3.5, 4.5, 5.5)** for opening details can be combined
- **Map marker properties (3.4, 6.2, 6.5)** can be consolidated into marker generation correctness
- **State management properties (2.6, 13.2, 13.3)** can be combined into state consistency properties
- **Helper tag properties (10.1-10.5)** can be consolidated into tag generation and behavior

The following properties represent the unique, non-redundant correctness guarantees:

### Core Filtering Properties

**Property 1: Brand Filter Correctness**
*For any* set of hotels and any list of brand names, filtering by those brands should return only hotels whose brand is in the specified list.
**Validates: Requirements 12.2**

**Property 2: Sentiment Filter Correctness (OR Logic)**
*For any* set of hotels and any list of sentiments, filtering by those sentiments should return only hotels that have at least one of the specified sentiments.
**Validates: Requirements 12.1, 12.9**

**Property 3: Amenity Filter Correctness (OR Logic)**
*For any* set of hotels and any list of amenities, filtering by those amenities should return only hotels that have at least one of the specified amenities.
**Validates: Requirements 12.3, 12.8**

**Property 4: Price Range Filter Correctness**
*For any* set of hotels and any price range (min, max), filtering by that range should return only hotels whose nightly rate is within the bounds (inclusive).
**Validates: Requirements 12.4**

**Property 5: Rating Filter Correctness**
*For any* set of hotels and any minimum rating value, filtering by that rating should return only hotels whose rating is greater than or equal to the minimum.
**Validates: Requirements 12.5**

**Property 6: Sort Order Correctness**
*For any* set of hotels and any sort direction (price_asc, price_desc, rating_desc), sorting should produce a result where each hotel is in the correct order relative to its neighbors according to the sort criteria.
**Validates: Requirements 12.6**

**Property 7: Filter Pipeline Order**
*For any* set of hotels and any search criteria, applying filters should follow the order: brand → sentiment → price → amenities → rating → sort, such that each filter operates on the output of the previous filter.
**Validates: Requirements 12.7**

**Property 8: Refinement Uses Current Results**
*For any* refinement search, the filtering should start with the currently displayed hotels (lastDisplayedHotels) rather than the complete hotel dataset.
**Validates: Requirements 12.10, 11.6, 2.8**



### Intent Classification and Handling

**Property 9: Intent Classification Completeness**
*For any* user query, the AI service should classify it into exactly one of the 11 defined intent types (location_only, preferences_only, complete_query, vague, unsupported, show_results_now, show_all, cheapest, most_expensive, hotel_info, refine_search).
**Validates: Requirements 11.1**

**Property 10: Show All Returns Complete Dataset**
*For any* query classified as "show_all" intent, the result should contain all hotels from the dataset without any filters applied.
**Validates: Requirements 11.3**

**Property 11: Cheapest/Most Expensive Returns Single Hotel**
*For any* query classified as "cheapest" or "most_expensive" intent, the result should contain exactly 1 hotel, which is the minimum or maximum priced hotel respectively.
**Validates: Requirements 11.4**

**Property 12: Hotel Info Intent Preserves Results**
*For any* query classified as "hotel_info" intent, the system should not perform a new search and should maintain the currently displayed hotels.
**Validates: Requirements 11.5, 2.7**

**Property 13: Intent History Tracking**
*For any* sequence of user queries, each classified intent should be appended to the intent history in the conversation state.
**Validates: Requirements 11.7**

### State Management Properties

**Property 14: State Persistence Across Turns**
*For any* conversation with multiple turns, state values (hasLocation, hasPreferences, conversationContext) should be maintained and accessible across all subsequent turns until explicitly cleared.
**Validates: Requirements 2.6, 13.2**

**Property 15: Last Displayed Hotels Tracking**
*For any* AI response that includes hotel results, those hotels should be stored in the lastDisplayedHotels property of the conversation state.
**Validates: Requirements 13.3**

**Property 16: State Used in Prompt Building**
*For any* AI query, the prompt should include relevant state values (location, brands, sentiments, amenities, priceRange, minRating, lastDisplayedHotels) from the conversation state.
**Validates: Requirements 13.5**

### UI Interaction Properties

**Property 17: Landing Dismissal on First Message**
*For any* first user message sent, the landing page (background image, header, welcome box) should be hidden and the main layout should be displayed.
**Validates: Requirements 1.5**

**Property 18: Detail View Opens on Card/Marker Click**
*For any* hotel card or map marker clicked, the detail view (drawer on desktop, bottom sheet on mobile) should open displaying that hotel's information.
**Validates: Requirements 3.5, 4.5, 5.5, 6.3**

**Property 19: Auto-Open Single Result on Desktop**
*For any* search result containing exactly 1 hotel when screen width > 1000px, the detail drawer should automatically open after 300ms.
**Validates: Requirements 8.1**

**Property 20: No Auto-Open on Mobile**
*For any* search result containing exactly 1 hotel when screen width ≤ 1000px, the detail view should NOT automatically open.
**Validates: Requirements 8.2**



### Map and Marker Properties

**Property 21: Marker Generation Completeness**
*For any* set of filtered hotels, the map should display exactly one marker for each hotel, with each marker containing the hotel's brand color, brand logo, and nightly rate.
**Validates: Requirements 3.4, 6.2**

**Property 22: Markers Match Filtered Results**
*For any* filtered hotel result set, the map markers should only show hotels from that filtered set, not from the complete dataset.
**Validates: Requirements 6.5**

**Property 23: Map Updates on Result Changes**
*For any* change to the filtered hotel results, the map markers should be updated to reflect the new result set.
**Validates: Requirements 6.4**

### Helper Tags Properties

**Property 24: Helper Tags Visibility**
*For any* application state, helper tags should be visible if and only if there are current search results (resultCount > 0).
**Validates: Requirements 10.1, 10.6**

**Property 25: Helper Tags Generated from Current Results**
*For any* set of filtered hotels, the helper tags should be generated from amenities and locations present in those hotels, not from the complete dataset.
**Validates: Requirements 10.2**

**Property 26: Helper Tag Click Sends Query**
*For any* helper tag clicked, the system should populate the input field with the tag's query text and submit it as a new user message.
**Validates: Requirements 10.4**

**Property 27: Helper Tags Update with Results**
*For any* new search result, the helper tags should be regenerated based on the new result set.
**Validates: Requirements 10.5**

### Date Selection Properties

**Property 28: Date Prompt for Small Result Sets**
*For any* search result with count ≤ 3, the AI should include a date selection prompt with result-count-specific messaging (1 result, 2 results, or 3 results).
**Validates: Requirements 9.1**

**Property 29: Date Selection Message Format**
*For any* date selection (checkIn, checkOut, guestCount), the generated message should follow the format: "I'd like to book from [date] to [date] for [X] guest(s)".
**Validates: Requirements 9.6**

**Property 30: Date Confirmation Without Re-search**
*For any* date selection confirmation, the AI should acknowledge the dates without triggering a new hotel search.
**Validates: Requirements 9.7**

**Property 31: Dates Stored in State**
*For any* date selection applied, the checkIn, checkOut, and guestCount values should be stored in the conversation state.
**Validates: Requirements 9.8**



### AI Response Properties

**Property 32: AI Response Brevity**
*For any* AI response message, the text should contain at most 4 sentences.
**Validates: Requirements 2.3**

**Property 33: Natural Language Input Acceptance**
*For any* string input submitted through the chat interface, the system should accept and process it without rejecting based on format or content.
**Validates: Requirements 2.1**

**Property 34: Search Criteria Extraction**
*For any* user query processed by the AI, the response should include valid search criteria (brands, sentiments, amenities, priceRange, minRating, sortBy) when the intent requires searching.
**Validates: Requirements 2.2**

### Error Handling Properties

**Property 35: API Failure Fallback**
*For any* AI API request that fails (timeout, network error, parse error), the system should fall back to keyword-based processing and return a valid response.
**Validates: Requirements 14.1**

**Property 36: Keyword Extraction in Fallback**
*For any* query processed by fallback logic, the system should extract keywords for location, brand, amenities, and price to build search criteria.
**Validates: Requirements 14.2**

**Property 37: Error Logging**
*For any* error that occurs (API failure, parse error, network error), the system should log the error with context (query, timestamp, error type).
**Validates: Requirements 14.3**

**Property 38: No User-Facing Errors**
*For any* error that occurs, the user should receive a valid response message and should never see error details or stack traces.
**Validates: Requirements 14.4**

**Property 39: Fallback Response Validity**
*For any* fallback response, it should conform to the AIResponse interface with valid intent, message, and optional search criteria.
**Validates: Requirements 14.5**

### Performance Properties

**Property 40: Query Debouncing**
*For any* sequence of rapid user inputs (within 300ms), only the final input should be processed and sent to the AI service.
**Validates: Requirements 15.6**

**Property 41: Request Cancellation**
*For any* new query submitted while a previous AI request is in-flight, the previous request should be cancelled before the new request is sent.
**Validates: Requirements 15.7**

### Hotel Card and Display Properties

**Property 42: Hotel Card Content Completeness**
*For any* hotel displayed in a card, the card should contain the hotel's image, name, star rating, brand chiclet with logo, and nightly rate with breakdown.
**Validates: Requirements 5.1**

**Property 43: Brand Chiclet Correctness**
*For any* hotel displayed, the brand chiclet should use the correct brand logo image and brand-specific background color.
**Validates: Requirements 5.7**

**Property 44: Detail View Content Completeness**
*For any* hotel displayed in the detail view, it should show the hotel name, image gallery, full description, complete amenities list, location address, rating, brand, pricing breakdown, brand chiclet, and phone number.
**Validates: Requirements 7.3**

**Property 45: View More Button Visibility**
*For any* mobile search result with more than 3 hotels, a "View X More" button should be displayed.
**Validates: Requirements 4.3**



## Error Handling

### Error Categories

1. **AI API Errors**
   - Network failures
   - Timeout (30 seconds)
   - Invalid API key
   - Rate limiting
   - JSON parse errors

2. **Data Loading Errors**
   - Hotel data file not found
   - Invalid JSON format
   - Missing required fields

3. **User Input Errors**
   - Empty queries (handled gracefully)
   - Invalid date selections
   - Invalid guest counts

4. **Map Rendering Errors**
   - Leaflet initialization failures
   - Invalid coordinates
   - Marker creation errors

### Error Handling Strategy

#### AI Service Error Handling

```typescript
processQuery(query: string, state: ConversationState): Observable<AIResponse> {
  return this.http.post(GEMINI_API_URL, payload).pipe(
    timeout(30000),
    retry({
      count: 2,
      delay: (error, retryCount) => timer(1000 * retryCount)
    }),
    map(response => this.parseResponse(response)),
    catchError(error => {
      this.logError('AI API Error', error, query);
      return of(this.fallbackProcessing(query));
    })
  );
}
```

**Fallback Processing**:
- Extract keywords from query
- Match against known locations, brands, amenities
- Build basic SearchCriteria
- Return generic response template

#### Data Loading Error Handling

```typescript
loadHotels(): Observable<Hotel[]> {
  return this.http.get<Hotel[]>('/assets/hotels.json').pipe(
    map(hotels => this.validateHotels(hotels)),
    catchError(error => {
      this.logError('Data Loading Error', error);
      return of([]); // Return empty array, show user-friendly message
    })
  );
}
```

#### Date Validation

```typescript
validateDateRange(checkIn: Date, checkOut: Date): ValidationResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (checkIn < today) {
    return { valid: false, error: 'Check-in date must be today or later' };
  }
  
  if (checkOut <= checkIn) {
    return { valid: false, error: 'Check-out must be after check-in' };
  }
  
  const nights = this.calculateNights(checkIn, checkOut);
  if (nights > 30) {
    return { valid: false, error: 'Maximum stay is 30 nights' };
  }
  
  return { valid: true };
}
```

### Error Logging

All errors logged with context:

```typescript
interface ErrorLog {
  timestamp: Date;
  errorType: string;
  message: string;
  context: {
    query?: string;
    state?: Partial<ConversationState>;
    stackTrace?: string;
  };
}
```

Logged to console in development, can be extended to external logging service in production.

### User-Facing Error Messages

Generic, friendly messages shown to users:

- AI failure: "I'm having trouble processing that. Let me try a simpler approach..."
- Data loading failure: "We're having trouble loading hotel information. Please refresh the page."
- Date validation: Specific validation message (e.g., "Check-in date must be today or later")
- Map error: Map continues to function with fallback markers



## Testing Strategy

### Dual Testing Approach

The application requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property tests**: Verify universal properties across all inputs using randomized testing

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide input space.

### Property-Based Testing

**Library**: fast-check (TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `// Feature: angular-hotel-search, Property {N}: {property text}`

**Property Test Examples**:

```typescript
// Feature: angular-hotel-search, Property 1: Brand Filter Correctness
it('should filter hotels by brand correctly', () => {
  fc.assert(
    fc.property(
      fc.array(hotelArbitrary),
      fc.array(fc.constantFrom('Kimpton', 'voco', 'InterContinental', 'Holiday Inn', 'Independent')),
      (hotels, brands) => {
        const filtered = hotelService.filterByBrand(hotels, brands);
        return filtered.every(h => brands.includes(h.brand));
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: angular-hotel-search, Property 4: Price Range Filter Correctness
it('should filter hotels by price range correctly', () => {
  fc.assert(
    fc.property(
      fc.array(hotelArbitrary),
      fc.integer({ min: 100, max: 500 }),
      fc.integer({ min: 500, max: 1000 }),
      (hotels, min, max) => {
        const filtered = hotelService.filterByPrice(hotels, min, max);
        return filtered.every(h => 
          h.pricing.nightlyRate >= min && h.pricing.nightlyRate <= max
        );
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: angular-hotel-search, Property 6: Sort Order Correctness
it('should sort hotels by price ascending correctly', () => {
  fc.assert(
    fc.property(
      fc.array(hotelArbitrary, { minLength: 2 }),
      (hotels) => {
        const sorted = hotelService.sortHotels(hotels, 'price_asc');
        for (let i = 0; i < sorted.length - 1; i++) {
          if (sorted[i].pricing.nightlyRate > sorted[i + 1].pricing.nightlyRate) {
            return false;
          }
        }
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

**Custom Arbitraries**:

```typescript
const hotelArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 5, maxLength: 50 }),
  brand: fc.constantFrom('Kimpton', 'voco', 'InterContinental', 'Holiday Inn', 'Independent'),
  rating: fc.integer({ min: 1, max: 5 }),
  location: fc.record({
    address: fc.string(),
    neighborhood: fc.string(),
    coordinates: fc.record({
      lat: fc.double({ min: 40.7, max: 40.8 }),
      lng: fc.double({ min: -74.1, max: -73.9 })
    })
  }),
  pricing: fc.record({
    nightlyRate: fc.integer({ min: 100, max: 1000 }),
    roomRate: fc.integer({ min: 80, max: 900 }),
    fees: fc.integer({ min: 20, max: 100 })
  }),
  amenities: fc.array(fc.constantFrom('Rooftop Bar', 'Fitness Center', 'Pet Friendly', 'Pool', 'Spa')),
  description: fc.string({ minLength: 50, maxLength: 200 }),
  imageUrls: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
  phone: fc.string(),
  sentiment: fc.array(fc.constantFrom('Times Square', 'Midtown', 'Broadway', 'Financial District'))
});
```

### Unit Testing

**Framework**: Jest with Angular Testing Library

**Coverage Areas**:

1. **Service Tests**:
   - AIService: Mock HTTP calls, test response parsing, fallback logic
   - HotelService: Test specific filter scenarios, edge cases (empty arrays, null values)
   - ConversationService: Test state updates, message history
   - MapService: Test marker creation, bounds calculation
   - DateService: Test date validation, formatting

2. **Component Tests**:
   - Test component rendering with specific inputs
   - Test event emissions
   - Test user interactions (clicks, input)
   - Test conditional rendering
   - Test responsive behavior

3. **Integration Tests**:
   - Test complete search flow (input → AI → filter → display)
   - Test refinement flow
   - Test date selection flow
   - Test detail view opening

4. **Edge Cases**:
   - Empty search results
   - Single result auto-open
   - Maximum result sets (100+ hotels)
   - Invalid date selections
   - API failures

**Example Unit Tests**:

```typescript
describe('HotelService', () => {
  it('should return empty array when filtering with no matching brands', () => {
    const hotels = [
      { ...mockHotel, brand: 'Kimpton' },
      { ...mockHotel, brand: 'voco' }
    ];
    const result = service.filterByBrand(hotels, ['InterContinental']);
    expect(result).toEqual([]);
  });
  
  it('should handle null price range gracefully', () => {
    const hotels = [mockHotel];
    const result = service.filterByPrice(hotels, null, null);
    expect(result).toEqual(hotels);
  });
  
  it('should apply filters in correct order', () => {
    const criteria: SearchCriteria = {
      brands: ['Kimpton'],
      sentiments: ['Times Square'],
      minRating: 4
    };
    const spy = jest.spyOn(service, 'filterByBrand');
    service.filterHotels(allHotels, criteria);
    expect(spy).toHaveBeenCalledBefore(service.filterBySentiment);
  });
});

describe('ConversationService', () => {
  it('should add message to history', () => {
    const message: Message = {
      id: '1',
      sender: 'user',
      text: 'test',
      timestamp: new Date()
    };
    service.addMessage(message);
    service.getMessages().subscribe(messages => {
      expect(messages).toContain(message);
    });
  });
  
  it('should update state and emit changes', (done) => {
    service.getState().subscribe(state => {
      if (state.hasLocation) {
        expect(state.hasLocation).toBe(true);
        done();
      }
    });
    service.updateState({ hasLocation: true });
  });
});
```

### E2E Testing

**Framework**: Cypress or Playwright

**Critical User Flows**:

1. **Basic Search Flow**:
   - User enters query
   - AI responds with results
   - Hotels displayed on map and cards
   - User clicks card to view details

2. **Refinement Flow**:
   - User performs initial search
   - User refines with helper tag
   - Results update without full reload

3. **Date Selection Flow**:
   - User searches, gets ≤3 results
   - User clicks "Select Dates"
   - User picks dates and applies
   - Confirmation message appears

4. **Mobile Flow**:
   - User searches on mobile
   - Inline cards appear
   - User clicks "View All"
   - Map overlay opens

### Coverage Goals

- **Overall**: 80%+ code coverage
- **Services**: 90%+ coverage (critical business logic)
- **Components**: 70%+ coverage (UI logic)
- **Property tests**: All 45 correctness properties implemented
- **Unit tests**: All edge cases and error conditions covered

### Test Organization

```
src/
├── app/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── chat.component.ts
│   │   │   ├── chat.component.spec.ts
│   │   │   └── chat.component.pbt.spec.ts (property tests)
│   │   └── ...
│   ├── services/
│   │   ├── hotel/
│   │   │   ├── hotel.service.ts
│   │   │   ├── hotel.service.spec.ts
│   │   │   └── hotel.service.pbt.spec.ts (property tests)
│   │   └── ...
│   └── ...
└── e2e/
    ├── search.spec.ts
    ├── refinement.spec.ts
    └── date-selection.spec.ts
```

### Continuous Integration

- Run all tests on every commit
- Fail build if coverage drops below 80%
- Run property tests with increased iterations (1000) in CI
- E2E tests run on staging environment

