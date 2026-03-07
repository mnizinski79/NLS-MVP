# Implementation Plan: Angular Hotel Search Application

## Overview

This implementation plan breaks down the Angular Hotel Search Application into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to validate functionality early. The plan follows a bottom-up approach: core services first, then components, then integration.

The application uses Angular 17+ with standalone components, TypeScript strict mode, RxJS for state management, Tailwind CSS for styling, and integrates with Google Gemini AI for conversational search.

## Tasks

- [x] 1. Project setup and configuration
  - Create Angular 17+ project with standalone components
  - Configure TypeScript strict mode
  - Install and configure Tailwind CSS
  - Install dependencies: @asymmetrik/ngx-leaflet, flatpickr, fast-check, jest
  - Set up project structure (components/, services/, models/, assets/)
  - Configure environment files for API configuration
  - _Requirements: Technical Requirements - Architecture, Styling_

- [x] 2. Define core data models and interfaces
  - [x] 2.1 Create Hotel interface with all properties
    - Define Hotel type with id, name, brand, rating, location, pricing, amenities, description, imageUrls, phone, sentiment
    - _Requirements: Technical Requirements - Data Models_
  
  - [x] 2.2 Create ConversationState interface
    - Define state structure with hasLocation, hasPreferences, resultCount, conversationContext, lastIntent, intentHistory, turnCount, lastQuery, lastResponse, lastDisplayedHotels
    - _Requirements: US-13 (13.1)_
  
  - [x] 2.3 Create SearchCriteria, AIResponse, IntentType, Message, Tag, DateSelection, AppConfig interfaces
    - Define all supporting interfaces for type safety
    - _Requirements: Technical Requirements - Data Models_
  
  - [x] 2.4 Create brand configuration constants
    - Define BRAND_COLORS and BRAND_LOGOS mappings
    - _Requirements: US-5 (5.7)_

- [x] 3. Implement HotelService with filtering and sorting logic
  - [x] 3.1 Create HotelService with loadHotels method
    - Implement HTTP call to load hotels.json
    - Add error handling for data loading failures
    - _Requirements: US-12, 14.1_
  
  - [x] 3.2 Implement brand filter
    - Create filterByBrand method
    - _Requirements: US-12 (12.2)_
  
  - [ ]* 3.3 Write property test for brand filter
    - **Property 1: Brand Filter Correctness**
    - **Validates: Requirements 12.2**
  
  - [x] 3.4 Implement sentiment filter with OR logic
    - Create filterBySentiment method
    - _Requirements: US-12 (12.1, 12.9)_
  
  - [ ]* 3.5 Write property test for sentiment filter
    - **Property 2: Sentiment Filter Correctness (OR Logic)**
    - **Validates: Requirements 12.1, 12.9**
  
  - [x] 3.6 Implement amenity filter with OR logic
    - Create filterByAmenities method
    - _Requirements: US-12 (12.3, 12.8)_
  
  - [ ]* 3.7 Write property test for amenity filter
    - **Property 3: Amenity Filter Correctness (OR Logic)**
    - **Validates: Requirements 12.3, 12.8**
  
  - [x] 3.8 Implement price range filter
    - Create filterByPrice method with min/max bounds
    - _Requirements: US-12 (12.4)_
  
  - [ ]* 3.9 Write property test for price range filter
    - **Property 4: Price Range Filter Correctness**
    - **Validates: Requirements 12.4**
  
  - [x] 3.10 Implement rating filter
    - Create filterByRating method
    - _Requirements: US-12 (12.5)_
  
  - [ ]* 3.11 Write property test for rating filter
    - **Property 5: Rating Filter Correctness**
    - **Validates: Requirements 12.5**
  
  - [x] 3.12 Implement sorting logic
    - Create sortHotels method with price_asc, price_desc, rating_desc options
    - _Requirements: US-12 (12.6)_
  
  - [ ]* 3.13 Write property test for sort order
    - **Property 6: Sort Order Correctness**
    - **Validates: Requirements 12.6**
  
  - [x] 3.14 Implement main filterHotels method with pipeline
    - Apply filters in order: brand → sentiment → price → amenities → rating → sort
    - _Requirements: US-12 (12.7)_
  
  - [ ]* 3.15 Write property test for filter pipeline order
    - **Property 7: Filter Pipeline Order**
    - **Validates: Requirements 12.7**
  
  - [ ]* 3.16 Write unit tests for edge cases
    - Test empty arrays, null values, no matches
    - _Requirements: US-12_



- [x] 4. Checkpoint - Ensure filtering tests pass
  - Ensure all HotelService tests pass, ask the user if questions arise.

- [x] 5. Implement ConversationService for state management
  - [x] 5.1 Create ConversationService with BehaviorSubjects
    - Initialize conversationState$ and messages$ observables
    - _Requirements: US-13 (13.1)_
  
  - [x] 5.2 Implement state management methods
    - Create getState, updateState, addMessage, getMessages, clearConversation, getLastDisplayedHotels methods
    - _Requirements: US-13 (13.2, 13.3)_
  
  - [ ]* 5.3 Write property test for state persistence
    - **Property 14: State Persistence Across Turns**
    - **Validates: Requirements 2.6, 13.2**
  
  - [ ]* 5.4 Write property test for last displayed hotels tracking
    - **Property 15: Last Displayed Hotels Tracking**
    - **Validates: Requirements 13.3**
  
  - [ ]* 5.5 Write unit tests for state updates
    - Test state updates, message additions, state clearing
    - _Requirements: US-13_

- [x] 6. Implement ConfigService for API configuration
  - [x] 6.1 Create ConfigService with loadConfig method
    - Implement HTTP call to /api/config endpoint
    - Cache configuration after loading
    - _Requirements: Technical Requirements - API Integration_
  
  - [x] 6.2 Implement getApiKey method
    - Return cached API key
    - _Requirements: Technical Requirements - Security_
  
  - [ ]* 6.3 Write unit tests for config loading
    - Test successful load, error handling, caching
    - _Requirements: Technical Requirements - API Integration_

- [x] 7. Implement AIService for Gemini integration
  - [x] 7.1 Create AIService with processQuery method
    - Implement HTTP call to Gemini API with timeout and retry logic
    - _Requirements: US-2 (2.2), US-11, 14.1_
  
  - [x] 7.2 Implement buildPrompt method
    - Build prompt with conversation context and state
    - _Requirements: US-2 (2.2), 13.5_
  
  - [ ]* 7.3 Write property test for state used in prompt building
    - **Property 16: State Used in Prompt Building**
    - **Validates: Requirements 13.5**
  
  - [x] 7.4 Implement parseResponse method
    - Parse JSON response from Gemini
    - Validate intent and criteria
    - _Requirements: US-2 (2.2), US-11_
  
  - [x] 7.5 Implement fallbackProcessing method
    - Extract keywords for location, brand, amenities, price
    - Build SearchCriteria from keywords
    - _Requirements: US-14 (14.1, 14.2)_
  
  - [ ]* 7.6 Write property test for API failure fallback
    - **Property 35: API Failure Fallback**
    - **Validates: Requirements 14.1**
  
  - [ ]* 7.7 Write property test for keyword extraction
    - **Property 36: Keyword Extraction in Fallback**
    - **Validates: Requirements 14.2**
  
  - [ ]* 7.8 Write property test for error logging
    - **Property 37: Error Logging**
    - **Validates: Requirements 14.3**
  
  - [ ]* 7.9 Write property test for no user-facing errors
    - **Property 38: No User-Facing Errors**
    - **Validates: Requirements 14.4**
  
  - [ ]* 7.10 Write unit tests for AI service
    - Test response parsing, error handling, fallback logic
    - _Requirements: US-2, US-14_

- [x] 8. Checkpoint - Ensure core services pass tests
  - Ensure all service tests pass, ask the user if questions arise.



- [x] 9. Implement MapService for Leaflet utilities
  - [x] 9.1 Create MapService with createCustomMarker method
    - Generate marker HTML with brand styling
    - Attach click handlers
    - _Requirements: US-6 (6.2)_
  
  - [x] 9.2 Implement getMarkerHtml method
    - Create HTML string with brand chiclet, logo, and price
    - _Requirements: US-6 (6.2)_
  
  - [x] 9.3 Implement calculateBounds method
    - Calculate LatLngBounds for hotel set
    - _Requirements: US-6 (6.4)_
  
  - [x] 9.4 Implement getDefaultMapOptions method
    - Return Leaflet map configuration
    - _Requirements: US-6 (6.1)_
  
  - [ ]* 9.5 Write unit tests for map service
    - Test marker creation, bounds calculation
    - _Requirements: US-6_

- [x] 10. Implement DateService for date picker utilities
  - [x] 10.1 Create DateService with getFlatpickrOptions method
    - Return Flatpickr configuration for range mode
    - _Requirements: US-9 (9.5)_
  
  - [x] 10.2 Implement formatDateRange method
    - Format dates for display
    - _Requirements: US-9 (9.6)_
  
  - [x] 10.3 Implement validateDateRange method
    - Validate check-in/check-out dates
    - _Requirements: US-9_
  
  - [x] 10.4 Implement calculateNights method
    - Calculate night count between dates
    - _Requirements: US-9_
  
  - [ ]* 10.5 Write unit tests for date service
    - Test validation, formatting, calculations
    - _Requirements: US-9_

- [x] 11. Create reusable HotelCardComponent
  - [x] 11.1 Create component with inputs and outputs
    - Inputs: hotel, variant ('desktop' | 'mobile'), highlighted
    - Outputs: cardClicked
    - _Requirements: US-5_
  
  - [x] 11.2 Implement template with hotel information
    - Display image, name, rating, brand chiclet, price
    - _Requirements: US-5 (5.1)_
  
  - [ ]* 11.3 Write property test for card content completeness
    - **Property 42: Hotel Card Content Completeness**
    - **Validates: Requirements 5.1**
  
  - [ ]* 11.4 Write property test for brand chiclet correctness
    - **Property 43: Brand Chiclet Correctness**
    - **Validates: Requirements 5.7**
  
  - [x] 11.5 Add Tailwind styles for desktop and mobile variants
    - Desktop: 280px × 340px, Mobile: 240px × 300px
    - Add hover effects for desktop
    - _Requirements: US-5 (5.2, 5.3, 5.4)_
  
  - [ ]* 11.6 Write unit tests for card component
    - Test rendering, click events, variant styles
    - _Requirements: US-5_

- [x] 12. Create ThinkingAnimationComponent
  - [x] 12.1 Create component with visible input
    - Display three animated dots
    - _Requirements: US-2 (2.5)_
  
  - [x] 12.2 Add CSS animations
    - Implement bounce animation with staggered delays
    - _Requirements: US-2 (2.5)_
  
  - [ ]* 12.3 Write unit test for thinking animation
    - Test visibility toggling
    - _Requirements: US-2 (2.5)_



- [x] 13. Create MapComponent with Leaflet integration
  - [x] 13.1 Create component with inputs and outputs
    - Inputs: hotels, center, zoom
    - Outputs: markerClicked
    - _Requirements: US-6_
  
  - [x] 13.2 Implement initMap method
    - Initialize Leaflet map with default options
    - _Requirements: US-6 (6.1)_
  
  - [x] 13.3 Implement updateMarkers method
    - Clear existing markers, create new markers for hotels
    - _Requirements: US-6 (6.4)_
  
  - [ ]* 13.4 Write property test for marker generation completeness
    - **Property 21: Marker Generation Completeness**
    - **Validates: Requirements 3.4, 6.2**
  
  - [ ]* 13.5 Write property test for markers matching filtered results
    - **Property 22: Markers Match Filtered Results**
    - **Validates: Requirements 6.5**
  
  - [ ]* 13.6 Write property test for map updates on result changes
    - **Property 23: Map Updates on Result Changes**
    - **Validates: Requirements 6.4**
  
  - [x] 13.7 Implement centerOnHotels method
    - Adjust map bounds to fit all markers
    - _Requirements: US-6 (6.4)_
  
  - [ ]* 13.8 Write unit tests for map component
    - Test initialization, marker updates, click handling
    - _Requirements: US-6_

- [x] 14. Create InputComponent for message input
  - [x] 14.1 Create component with inputs and outputs
    - Inputs: disabled, placeholder
    - Outputs: messageSent
    - _Requirements: US-2 (2.1)_
  
  - [x] 14.2 Implement template with input field and send button
    - Add mobile-optimized attributes (autocomplete, autocorrect, autocapitalize)
    - _Requirements: US-2 (2.1), US-4 (4.7)_
  
  - [x] 14.3 Implement onSubmit method with validation
    - Validate non-empty input, emit message, clear input
    - _Requirements: US-2 (2.1)_
  
  - [ ]* 14.4 Write property test for natural language input acceptance
    - **Property 33: Natural Language Input Acceptance**
    - **Validates: Requirements 2.1**
  
  - [x] 14.5 Add debouncing for rapid inputs
    - Debounce input with 300ms delay
    - _Requirements: US-15 (15.6)_
  
  - [ ]* 14.6 Write property test for query debouncing
    - **Property 40: Query Debouncing**
    - **Validates: Requirements 15.6**
  
  - [ ]* 14.7 Write unit tests for input component
    - Test input validation, submission, debouncing
    - _Requirements: US-2, US-15_

- [x] 15. Create HelperTagsComponent for refinement suggestions
  - [x] 15.1 Create component with inputs and outputs
    - Inputs: hotels, visible
    - Outputs: tagClicked
    - _Requirements: US-10_
  
  - [x] 15.2 Implement generateTags method
    - Extract top 3 amenities and up to 2 locations from hotels
    - _Requirements: US-10 (10.2)_
  
  - [ ]* 15.3 Write property test for helper tags visibility
    - **Property 24: Helper Tags Visibility**
    - **Validates: Requirements 10.1, 10.6**
  
  - [ ]* 15.4 Write property test for tags generated from current results
    - **Property 25: Helper Tags Generated from Current Results**
    - **Validates: Requirements 10.2**
  
  - [ ]* 15.5 Write property test for tag click sends query
    - **Property 26: Helper Tag Click Sends Query**
    - **Validates: Requirements 10.4**
  
  - [ ]* 15.6 Write property test for tags update with results
    - **Property 27: Helper Tags Update with Results**
    - **Validates: Requirements 10.5**
  
  - [x] 15.7 Implement template with pill-shaped buttons
    - Add icons, labels, hover effects, horizontal scroll
    - _Requirements: US-10 (10.3, 10.7)_
  
  - [ ]* 15.8 Write unit tests for helper tags component
    - Test tag generation, click handling, visibility
    - _Requirements: US-10_

- [x] 16. Checkpoint - Ensure component tests pass
  - Ensure all component tests pass, ask the user if questions arise.



- [x] 17. Create DatePickerComponent for date selection
  - [x] 17.1 Create component with inputs and outputs
    - Inputs: visible
    - Outputs: datesSelected, cancelled
    - _Requirements: US-9_
  
  - [x] 17.2 Implement initFlatpickr method
    - Initialize Flatpickr in range mode
    - _Requirements: US-9 (9.5)_
  
  - [x] 17.3 Implement template with calendar and guest dropdown
    - Add Cancel and Apply buttons
    - _Requirements: US-9 (9.5)_
  
  - [x] 17.4 Implement onApply method with validation
    - Validate date range, emit selection
    - _Requirements: US-9 (9.6)_
  
  - [ ]* 17.5 Write property test for date selection message format
    - **Property 29: Date Selection Message Format**
    - **Validates: Requirements 9.6**
  
  - [ ]* 17.6 Write property test for dates stored in state
    - **Property 31: Dates Stored in State**
    - **Validates: Requirements 9.8**
  
  - [ ]* 17.7 Write unit tests for date picker
    - Test validation, formatting, apply/cancel
    - _Requirements: US-9_

- [x] 18. Create ChatComponent for message display
  - [x] 18.1 Create component with inputs
    - Inputs: messages, isThinking, isMobile
    - _Requirements: US-2_
  
  - [x] 18.2 Implement template with message list
    - Render user and AI messages with different styles
    - Include ThinkingAnimationComponent
    - _Requirements: US-2_
  
  - [x] 18.3 Implement scrollToBottom method
    - Auto-scroll to latest message on updates
    - _Requirements: US-2_
  
  - [x] 18.4 Add support for inline hotel cards (mobile)
    - Display max 3 hotel cards inline
    - _Requirements: US-4 (4.2, 4.3)_
  
  - [ ]* 18.5 Write property test for view more button visibility
    - **Property 45: View More Button Visibility**
    - **Validates: Requirements 4.3**
  
  - [ ]* 18.6 Write unit tests for chat component
    - Test message rendering, scrolling, inline cards
    - _Requirements: US-2, US-4_

- [x] 19. Create HotelDetailDrawerComponent for desktop
  - [x] 19.1 Create component with inputs and outputs
    - Inputs: hotel, visible
    - Outputs: closed
    - _Requirements: US-7 (7.1)_
  
  - [x] 19.2 Implement template with hotel details
    - Display name, image gallery, description, amenities, location, rating, pricing, brand, phone
    - _Requirements: US-7 (7.3)_
  
  - [ ]* 19.3 Write property test for detail view content completeness
    - **Property 44: Detail View Content Completeness**
    - **Validates: Requirements 7.3**
  
  - [x] 19.4 Add slide-in animation from right
    - 33% width, slide animation
    - _Requirements: US-7 (7.1)_
  
  - [x] 19.5 Implement close method
    - Handle close button and outside clicks
    - _Requirements: US-7 (7.4)_
  
  - [ ]* 19.6 Write unit tests for detail drawer
    - Test rendering, animations, close handling
    - _Requirements: US-7_

- [x] 20. Create HotelDetailBottomSheetComponent for mobile
  - [x] 20.1 Create component with inputs and outputs
    - Inputs: hotel, visible
    - Outputs: closed
    - _Requirements: US-7 (7.2)_
  
  - [x] 20.2 Implement template with hotel details
    - Same content as drawer, optimized for mobile
    - _Requirements: US-7 (7.3)_
  
  - [x] 20.3 Add slide-up animation from bottom
    - Max 90vh height, slide animation
    - _Requirements: US-7 (7.2)_
  
  - [x] 20.4 Implement swipe-to-close gesture
    - Track touch events for swipe down
    - _Requirements: US-7 (7.4)_
  
  - [ ]* 20.5 Write unit tests for bottom sheet
    - Test rendering, animations, swipe handling
    - _Requirements: US-7_



- [x] 21. Create LandingComponent for initial view
  - [x] 21.1 Create component with inputs and outputs
    - Inputs: visible
    - Outputs: dismissed
    - _Requirements: US-1_
  
  - [x] 21.2 Implement template with background image
    - Full-screen background with landing-desktop.png
    - Semi-transparent header (50% opacity)
    - Semi-transparent input bar (50% opacity)
    - _Requirements: US-1 (1.1, 1.2, 1.3)_
  
  - [x] 21.3 Add welcome box with example queries
    - Centered welcome message, description, 3 example queries
    - _Requirements: US-1 (1.4)_
  
  - [x] 21.4 Implement onFirstMessage method
    - Hide landing, emit dismissed event
    - _Requirements: US-1 (1.5)_
  
  - [ ]* 21.5 Write property test for landing dismissal
    - **Property 17: Landing Dismissal on First Message**
    - **Validates: Requirements 1.5**
  
  - [x] 21.6 Add fade-out transition
    - Smooth transition to main layout
    - _Requirements: US-1 (1.6)_
  
  - [ ]* 21.7 Write unit tests for landing component
    - Test rendering, dismissal, transitions
    - _Requirements: US-1_

- [x] 22. Create layout components (Desktop and Mobile)
  - [x] 22.1 Create DesktopLayoutComponent
    - Split-screen: left panel (33%), right panel (67%)
    - Left: header, chat, helper tags, input
    - Right: map, hotel cards, detail drawer
    - _Requirements: US-3_
  
  - [x] 22.2 Create MobileLayoutComponent
    - Full-screen chat with inline cards
    - Fixed input at bottom
    - Map overlay (toggled)
    - Bottom sheet for details
    - _Requirements: US-4_
  
  - [ ]* 22.3 Write unit tests for layout components
    - Test structure, responsive behavior
    - _Requirements: US-3, US-4_

- [x] 23. Implement main application orchestration in AppComponent
  - [x] 23.1 Set up viewport detection
    - Create isMobile$ observable based on window width
    - _Requirements: US-3, US-4_
  
  - [x] 23.2 Implement hotel data loading on init
    - Load hotels via HotelService
    - _Requirements: Technical Requirements_
  
  - [x] 23.3 Implement message submission handler
    - Handle user input, call AIService, update state
    - _Requirements: US-2_
  
  - [ ]* 23.4 Write property test for search criteria extraction
    - **Property 34: Search Criteria Extraction**
    - **Validates: Requirements 2.2**
  
  - [x] 23.5 Implement search execution logic
    - Determine new search vs refinement
    - Call HotelService with criteria
    - Update conversation state with results
    - _Requirements: US-11, US-12_
  
  - [ ]* 23.6 Write property test for refinement uses current results
    - **Property 8: Refinement Uses Current Results**
    - **Validates: Requirements 12.10, 11.6, 2.8**
  
  - [x] 23.7 Implement intent-specific handling
    - Handle show_all, cheapest, most_expensive, hotel_info, refine_search intents
    - _Requirements: US-11_
  
  - [ ]* 23.8 Write property tests for intent handling
    - **Property 10: Show All Returns Complete Dataset**
    - **Property 11: Cheapest/Most Expensive Returns Single Hotel**
    - **Property 12: Hotel Info Intent Preserves Results**
    - **Validates: Requirements 11.3, 11.4, 11.5**
  
  - [x] 23.9 Implement request cancellation
    - Cancel in-flight AI requests when new query submitted
    - _Requirements: US-15 (15.7)_
  
  - [ ]* 23.10 Write property test for request cancellation
    - **Property 41: Request Cancellation**
    - **Validates: Requirements 15.7**

- [x] 24. Checkpoint - Ensure integration tests pass
  - Ensure all integration tests pass, ask the user if questions arise.



- [x] 25. Implement detail view interaction logic
  - [x] 25.1 Add card/marker click handlers
    - Open detail view when card or marker clicked
    - _Requirements: US-7_
  
  - [ ]* 25.2 Write property test for detail view opens on click
    - **Property 18: Detail View Opens on Card/Marker Click**
    - **Validates: Requirements 3.5, 4.5, 5.5, 6.3**
  
  - [x] 25.3 Implement auto-open for single result on desktop
    - Check screen width > 1000px and result count === 1
    - Open detail drawer after 300ms delay
    - _Requirements: US-8 (8.1)_
  
  - [ ]* 25.4 Write property test for auto-open single result on desktop
    - **Property 19: Auto-Open Single Result on Desktop**
    - **Validates: Requirements 8.1**
  
  - [ ]* 25.5 Write property test for no auto-open on mobile
    - **Property 20: No Auto-Open on Mobile**
    - **Validates: Requirements 8.2**
  
  - [ ]* 25.6 Write unit tests for detail view interactions
    - Test click handling, auto-open logic
    - _Requirements: US-7, US-8_

- [x] 26. Implement date selection flow
  - [x] 26.1 Add date prompt logic for small result sets
    - Show date picker button when resultCount ≤ 3
    - Display result-count-specific messages
    - _Requirements: US-9 (9.1, 9.2, 9.3)_
  
  - [ ]* 26.2 Write property test for date prompt
    - **Property 28: Date Prompt for Small Result Sets**
    - **Validates: Requirements 9.1**
  
  - [x] 26.3 Implement date selection handler
    - Format message, send to AI, update state
    - _Requirements: US-9 (9.6, 9.8)_
  
  - [x] 26.4 Implement AI confirmation without re-search
    - AI acknowledges dates without triggering new search
    - _Requirements: US-9 (9.7)_
  
  - [ ]* 26.5 Write property test for date confirmation without re-search
    - **Property 30: Date Confirmation Without Re-search**
    - **Validates: Requirements 9.7**
  
  - [ ]* 26.6 Write unit tests for date selection flow
    - Test prompt display, message formatting, state updates
    - _Requirements: US-9_

- [x] 27. Implement AI response validation and brevity
  - [x] 27.1 Add response validation
    - Validate AIResponse structure
    - _Requirements: US-2_
  
  - [x] 27.2 Add sentence count validation
    - Ensure AI messages have ≤ 4 sentences
    - _Requirements: US-2 (2.3)_
  
  - [ ]* 27.3 Write property test for AI response brevity
    - **Property 32: AI Response Brevity**
    - **Validates: Requirements 2.3**
  
  - [ ]* 27.4 Write unit tests for response validation
    - Test structure validation, sentence counting
    - _Requirements: US-2_

- [x] 28. Add assets and styling
  - [x] 28.1 Add hotel data JSON file
    - Create hotels.json with NYC hotel data
    - _Requirements: Technical Requirements_
  
  - [x] 28.2 Add brand logo assets
    - Add SVG logos for all brands
    - _Requirements: US-5 (5.7)_
  
  - [x] 28.3 Add landing page background image
    - Add landing-desktop.png
    - _Requirements: US-1 (1.1)_
  
  - [x] 28.4 Configure Tailwind custom colors
    - Add primary, primary-light, accent colors
    - _Requirements: Technical Requirements - Styling_
  
  - [x] 28.5 Add global styles and animations
    - Add fade, slide, bounce animations
    - Configure Inter font family
    - _Requirements: Technical Requirements - Styling_



- [x] 29. Implement remaining property tests
  - [x]* 29.1 Write property test for intent classification completeness
    - **Property 9: Intent Classification Completeness**
    - **Validates: Requirements 11.1**
  
  - [x]* 29.2 Write property test for intent history tracking
    - **Property 13: Intent History Tracking**
    - **Validates: Requirements 11.7**
  
  - [x]* 29.3 Write property test for fallback response validity
    - **Property 39: Fallback Response Validity**
    - **Validates: Requirements 14.5**
  
  - [x]* 29.4 Write property test for helper tag structure
    - **Property 3: Each tag is a pill-shaped button with specific styling**
    - **Validates: Requirements 10.3**

- [x] 30. Implement accessibility features
  - [x] 30.1 Add ARIA labels to interactive elements
    - Add labels to buttons, inputs, cards, markers
    - _Requirements: Technical Requirements - Accessibility_
  
  - [x] 30.2 Implement keyboard navigation
    - Add keyboard support for cards, tags, detail views
    - _Requirements: Technical Requirements - Accessibility_
  
  - [x] 30.3 Add focus management
    - Manage focus for modals, drawers, bottom sheets
    - _Requirements: Technical Requirements - Accessibility_
  
  - [x] 30.4 Verify color contrast ratios
    - Ensure all text meets WCAG 2.1 AA (≥4.5:1)
    - _Requirements: Technical Requirements - Accessibility_
  
  - [ ]* 30.5 Write unit tests for accessibility
    - Test ARIA labels, keyboard navigation, focus management
    - _Requirements: Technical Requirements - Accessibility_

- [x] 31. Performance optimization
  - [x] 31.1 Implement lazy loading for hotel images
    - Add loading="lazy" attribute to images
    - _Requirements: US-15 (15.5)_
  
  - [x] 31.2 Add change detection optimization
    - Use OnPush strategy where appropriate
    - _Requirements: US-15_
  
  - [x] 31.3 Optimize bundle size
    - Configure lazy loading for routes if applicable
    - Tree-shake unused dependencies
    - _Requirements: US-15_
  
  - [ ]* 31.4 Write performance tests
    - Test debouncing, request cancellation, lazy loading
    - _Requirements: US-15_

- [x] 32. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 33. E2E testing
  - [x]* 33.1 Write E2E test for basic search flow
    - User enters query → AI responds → Hotels displayed → User clicks card → Details open
    - _Requirements: US-2, US-5, US-7_
  
  - [x]* 33.2 Write E2E test for refinement flow
    - User searches → User clicks helper tag → Results update
    - _Requirements: US-10, US-12_
  
  - [x]* 33.3 Write E2E test for date selection flow
    - User searches (≤3 results) → User clicks "Select Dates" → User picks dates → Confirmation appears
    - _Requirements: US-9_
  
  - [x]* 33.4 Write E2E test for mobile flow
    - User searches on mobile → Inline cards appear → User clicks "View All" → Map overlay opens
    - _Requirements: US-4_

- [x] 34. Documentation and cleanup
  - [x] 34.1 Add JSDoc comments to all services
    - Document public methods, parameters, return types
    - _Requirements: Technical Requirements_
  
  - [x] 34.2 Add component documentation
    - Document inputs, outputs, purpose
    - _Requirements: Technical Requirements_
  
  - [x] 34.3 Create README with setup instructions
    - Document installation, configuration, running the app
    - _Requirements: Technical Requirements_
  
  - [x] 34.4 Add inline code comments for complex logic
    - Comment filter pipeline, intent handling, state management
    - _Requirements: Technical Requirements_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- E2E tests validate critical user flows
- All services should be implemented before components to enable proper testing
- Integration happens incrementally throughout the implementation

