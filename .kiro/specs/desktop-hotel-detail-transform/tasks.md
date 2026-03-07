# Implementation Plan: Desktop Hotel Detail Transform

## Overview

This implementation transforms the desktop hotel detail view from a modal overlay to a page transformation. The work is organized into discrete tasks that build incrementally: first establishing state management and animation infrastructure, then implementing each of the three component transformations (cards, map, chat), integrating the detail panel, adding accessibility features, and finally comprehensive testing.

## Tasks

- [x] 1. Set up state management and animation infrastructure
  - Create ViewState interface and AnimationConfig types in appropriate model files
  - Add viewState, isAnimating, and previousMapState properties to DesktopLayoutComponent
  - Implement lockInteractions() and unlockInteractions() methods
  - Add TRANSFORM_ANIMATION_CONFIG constant with 350ms duration
  - _Requirements: 8.1, 8.2_

- [ ]* 1.1 Write property test for state management
  - **Property 19: View State Tracking**
  - **Validates: Requirements 8.1**

- [ ]* 1.2 Write property test for interaction locking
  - **Property 20: Interaction Locking During Animation**
  - **Validates: Requirements 8.2, 8.3**

- [x] 2. Implement hotel cards slide-out animation
  - [x] 2.1 Add CSS classes for card animations to desktop-layout.component.css
    - Add .sliding-out class with translateY(100%) and opacity: 0
    - Add .hidden class with display: none
    - Add transition properties with 350ms duration
    - Add will-change: transform, opacity for GPU acceleration
    - _Requirements: 1.1, 1.2, 6.2_
  
  - [x] 2.2 Implement slideCardsOut() and slideCardsIn() methods
    - Apply .sliding-out class to hotel-cards-container
    - Return Promise that resolves after 350ms
    - Apply .hidden class after animation completes
    - Implement reverse for slideCardsIn()
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 2.3 Write property test for card slide animation
    - **Property 2: Hotel Cards Slide and Fade**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  
  - [ ]* 2.4 Write property test for animation timing
    - **Property 8: Animation Timing Constraints** (cards portion)
    - **Validates: Requirements 1.5**

- [x] 3. Implement map expansion and zoom
  - [x] 3.1 Add map state properties and methods to MapComponent
    - Add focusedHotel and isExpanded properties
    - Add previousMapState storage
    - Implement expandAndZoomToHotel(hotel: Hotel) method using Leaflet's flyTo()
    - Set target zoom to 15.5, duration to 350ms
    - Implement restoreOriginalView() method
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [x] 3.2 Implement marker highlighting
    - Add highlightMarker(hotel: Hotel) method
    - Add clearHighlight() method
    - Apply custom CSS class to highlighted marker
    - Update marker styling in map.service.ts if needed
    - _Requirements: 2.3_
  
  - [x] 3.3 Add CSS for map expansion
    - Add .expanded class to map-container in desktop-layout.component.css
    - Add transition for height property (350ms)
    - Add will-change: height
    - _Requirements: 2.1, 6.2_
  
  - [ ]* 3.4 Write property test for map zoom
    - **Property 3: Map Zoom to Hotel Coordinates**
    - **Validates: Requirements 2.2, 2.3**
  
  - [ ]* 3.5 Write property test for map expansion
    - **Property 4: Map Expansion Fills Card Space**
    - **Validates: Requirements 2.1**

- [x] 4. Implement chat panel collapse
  - [x] 4.1 Add collapse functionality to ChatComponent
    - Add isCollapsed boolean property
    - Add collapse() and expand() methods returning Promises
    - Add toggleCollapse() method for chevron click
    - Update component template with [class.collapsed] binding
    - _Requirements: 3.1, 3.5_
  
  - [x] 4.2 Update chat template and styles
    - Add chevron button to chat header (*ngIf="isCollapsed")
    - Add .collapsed CSS class with max-height: 60px
    - Hide messages and input sections when collapsed (*ngIf="!isCollapsed")
    - Add transition for max-height and opacity (350ms)
    - Add will-change: max-height, opacity
    - _Requirements: 3.1, 3.2, 3.3, 6.2_
  
  - [ ]* 4.3 Write property test for chat collapse
    - **Property 5: Chat Collapse to Header Only**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [ ]* 4.4 Write property test for chevron expansion
    - **Property 6: Chat Chevron Expansion**
    - **Validates: Requirements 3.5**

- [x] 5. Checkpoint - Ensure all component animations work independently
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement coordinated transformation orchestration
  - [x] 6.1 Implement enterFocusedView() method in DesktopLayoutComponent
    - Check isAnimating flag and return early if true
    - Call lockInteractions()
    - Set viewState to 'transforming'
    - Store current map state in previousMapState
    - Call Promise.all() with slideCardsOut(), expandAndZoomMap(), collapseChat()
    - Set selectedHotel and showDetailDrawer after animations start
    - Set viewState to 'focused' and unlock interactions
    - _Requirements: 2.4, 3.4, 4.5, 8.2, 8.3_
  
  - [x] 6.2 Implement exitFocusedView() method in DesktopLayoutComponent
    - Check isAnimating flag and return early if true
    - Call lockInteractions()
    - Set viewState to 'transforming'
    - Hide detail drawer first
    - Call Promise.all() with slideCardsIn(), restoreMapView(), expandChat()
    - Clear selectedHotel and previousMapState
    - Set viewState to 'default' and unlock interactions
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [x] 6.3 Wire up hotel card click handler
    - Update onHotelCardClicked() to call enterFocusedView()
    - Update onDetailDrawerClosed() to call exitFocusedView()
    - _Requirements: 1.1, 5.1_
  
  - [ ]* 6.4 Write property test for simultaneous animation start
    - **Property 7: Simultaneous Animation Start**
    - **Validates: Requirements 2.4, 3.4**
  
  - [ ]* 6.5 Write property test for complete round trip
    - **Property 1: Complete Transformation Round Trip**
    - **Validates: Requirements 1.4, 2.5, 3.6, 5.3, 5.4**
  
  - [ ]* 6.6 Write property test for state consistency
    - **Property 12: Transform State Consistency**
    - **Validates: Requirements 4.5, 8.4**

- [x] 7. Remove backdrop from hotel detail drawer
  - [x] 7.1 Update HotelDetailDrawerComponent template
    - Remove backdrop div element entirely
    - Remove backdrop click handler
    - Keep drawer slide animation
    - _Requirements: 4.2_
  
  - [x] 7.2 Update HotelDetailDrawerComponent styles
    - Remove all .backdrop CSS rules
    - Adjust .drawer z-index if needed (keep at 50)
    - Ensure drawer still slides in/out correctly
    - _Requirements: 4.1, 4.2_
  
  - [ ]* 7.3 Write property test for no backdrop
    - **Property 9: No Backdrop Display**
    - **Validates: Requirements 4.2**
  
  - [ ]* 7.4 Write property test for detail panel slide direction
    - **Property 10: Detail Panel Slide Direction**
    - **Validates: Requirements 4.1, 5.2**

- [x] 8. Implement accessibility features
  - [x] 8.1 Add ARIA live region to DesktopLayoutComponent template
    - Add div with id="aria-live-region", role="status", aria-live="polite"
    - Add .sr-only class for screen-reader-only visibility
    - _Requirements: 7.4_
  
  - [x] 8.2 Implement announceStateChange() method
    - Query for aria-live-region element
    - Update textContent with state change messages
    - Call from enterFocusedView() and exitFocusedView()
    - _Requirements: 7.4_
  
  - [x] 8.3 Implement focus management
    - Store previouslyFocusedElement in enterFocusedView()
    - Move focus to drawer close button after animations
    - Restore focus to hotel card in exitFocusedView()
    - Add data-hotel-id attribute to hotel cards for focus restoration
    - _Requirements: 7.2, 7.3_
  
  - [x] 8.4 Add keyboard event handlers
    - Add @HostListener for Escape key to call exitFocusedView()
    - Add keyboard support (Enter/Space) to hotel cards
    - Ensure chevron button is keyboard accessible
    - _Requirements: 7.1, 7.5, 7.6_
  
  - [ ]* 8.5 Write property test for keyboard hotel selection
    - **Property 14: Keyboard Hotel Selection**
    - **Validates: Requirements 7.1**
  
  - [ ]* 8.6 Write property test for focus management round trip
    - **Property 15: Focus Management Round Trip**
    - **Validates: Requirements 7.2, 7.3**
  
  - [ ]* 8.7 Write property test for ARIA announcements
    - **Property 16: ARIA Live Region Updates**
    - **Validates: Requirements 7.4**
  
  - [ ]* 8.8 Write property test for collapsed chat keyboard access
    - **Property 17: Collapsed Chat Keyboard Access**
    - **Validates: Requirements 7.5**
  
  - [ ]* 8.9 Write property test for Escape key
    - **Property 18: Escape Key Closes Detail**
    - **Validates: Requirements 7.6**

- [x] 9. Implement error handling
  - [x] 9.1 Add animation cleanup on component destroy
    - Implement ngOnDestroy() in DesktopLayoutComponent
    - Clear all animation timers and promises
    - Remove animation CSS classes
    - Reset to default state
    - _Requirements: 8.5_
  
  - [x] 9.2 Add error handling for invalid hotel data
    - Check for valid coordinates in expandAndZoomToHotel()
    - Fall back to default map center if coordinates missing
    - Log error to console
    - Continue with other animations
    - _Requirements: 2.2_
  
  - [x] 9.3 Add error handling for map operations
    - Wrap Leaflet operations in try-catch
    - Log errors and continue with other animations
    - Display error message if map zoom fails
    - _Requirements: 2.2, 2.5_
  
  - [ ]* 9.4 Write unit tests for error conditions
    - Test animation interruption
    - Test invalid hotel data
    - Test map library errors
    - Test focus restoration failures

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Final integration and polish
  - [x] 11.1 Verify GPU-accelerated properties
    - Audit all animation CSS to ensure only transform, opacity, max-height used
    - Remove any animations on top, left, width, height
    - Add will-change hints where appropriate
    - _Requirements: 6.2_
  
  - [x] 11.2 Test animation timing consistency
    - Verify all animations use 350ms duration
    - Ensure timing falls within 300-400ms range
    - Test on different browsers/devices
    - _Requirements: 1.5, 2.6, 3.7, 4.4, 5.5_
  
  - [ ]* 11.3 Write property test for GPU-accelerated properties
    - **Property 13: GPU-Accelerated Properties**
    - **Validates: Requirements 6.2**
  
  - [ ]* 11.4 Write comprehensive animation timing test
    - **Property 8: Animation Timing Constraints** (all animations)
    - **Validates: Requirements 1.5, 2.6, 3.7, 4.4, 5.5, 6.4**
  
  - [ ]* 11.5 Write property test for animation sequencing
    - **Property 11: Animation Sequencing**
    - **Validates: Requirements 4.3**

- [x] 12. Final checkpoint - Complete testing and verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples, edge cases, and error conditions
- All animations use GPU-accelerated CSS properties (transform, opacity) for 60fps performance
- Animation duration is consistently 350ms (within 300-400ms requirement)
- Focus management ensures keyboard users can navigate the transformation seamlessly
