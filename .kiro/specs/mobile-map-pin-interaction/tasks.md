# Implementation Plan: Mobile Map Pin Interaction

## Overview

This implementation plan breaks down the mobile map pin interaction feature into discrete coding tasks. The approach follows a bottom-up strategy: first implementing core services (gesture recognition, state management), then enhancing existing components (map, bottom sheet), and finally wiring everything together with animations and accessibility features.

## Tasks

- [x] 1. Set up core services and interfaces
  - Create MapInteractionStateService with state management
  - Create GestureRecognitionService with touch event handling
  - Define TypeScript interfaces for MapInteractionState, GestureEvent, DragState, SheetConfig
  - Set up fast-check library for property-based testing
  - _Requirements: 9.1, 9.2, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 1.1 Write property test for state consistency
  - **Property 12: State Consistency**
  - **Validates: Requirements 9.1, 9.2**

- [x] 2. Implement GestureRecognitionService
  - [x] 2.1 Implement touch event handlers (onTouchStart, onTouchMove, onTouchEnd)
    - Track drag state with start position, current position, and velocity history
    - _Requirements: 6.5_
  
  - [x] 2.2 Implement velocity calculation algorithm
    - Calculate velocity using touch events from last 100ms
    - _Requirements: 6.5_
  
  - [x] 2.3 Implement gesture interpretation logic
    - Classify gestures based on distance thresholds (100px) and velocity (300px/s)
    - Return GestureEvent with type, deltaY, velocity, and timestamp
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 2.4 Write property test for gesture recognition by distance
  - **Property 5: Gesture Recognition by Distance**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ]* 2.5 Write property test for velocity-based gesture override
  - **Property 6: Velocity-Based Gesture Override**
  - **Validates: Requirements 6.4**

- [ ]* 2.6 Write property test for velocity calculation window
  - **Property 7: Velocity Calculation Window**
  - **Validates: Requirements 6.5**

- [ ]* 2.7 Write unit tests for edge cases
  - Test exactly 100px drag, exactly 300px/s velocity
  - Test malformed touch events
  - Test rapid gesture sequences
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 3. Implement MapInteractionStateService
  - [x] 3.1 Create state management with BehaviorSubject
    - Implement selectHotel, dismissSelection, setBottomSheetState, setDragging methods
    - Expose state as Observable and synchronous getter
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  
  - [x] 3.2 Implement original viewport preservation
    - Store original MapViewport when hotel is selected
    - Clear viewport on dismissal
    - _Requirements: 9.3_

- [ ]* 3.3 Write property test for original viewport preservation
  - **Property 13: Original Viewport Preservation**
  - **Validates: Requirements 9.3**

- [ ]* 3.4 Write unit tests for state transitions
  - Test state changes through complete selection/dismissal cycle
  - Test clearing state on dismissal
  - _Requirements: 9.1, 9.2, 9.5_

- [x] 4. Enhance MapComponent with pin highlighting and centering
  - [x] 4.1 Add selectedHotelId input and pin highlighting logic
    - Apply CSS class to selected marker
    - Remove highlight from previously selected marker
    - _Requirements: 1.3, 1.4, 8.1_
  
  - [x] 4.2 Implement map centering with offset calculation
    - Calculate center position accounting for bottom sheet height (top 1/3 positioning)
    - Implement centerOnHotel method with offsetY parameter
    - _Requirements: 2.1, 2.2_
  
  - [x] 4.3 Implement viewport storage and restoration
    - Add getCurrentViewport and restoreViewport methods
    - _Requirements: 9.3, 5.4_

- [ ]* 4.4 Write property test for single pin highlight
  - **Property 1: Single Pin Highlight**
  - **Validates: Requirements 1.3, 1.4, 8.1**

- [ ]* 4.5 Write property test for map centering with offset
  - **Property 3: Map Centering with Offset**
  - **Validates: Requirements 2.1, 2.2**

- [ ]* 4.6 Write unit tests for invalid coordinates
  - Test behavior when hotel has missing or invalid coordinates
  - _Requirements: 2.1_

- [x] 5. Create AnimationService
  - [x] 5.1 Implement animateValue with configurable duration and easing
    - Use requestAnimationFrame for smooth animations
    - Support cubic-bezier and spring easing functions
    - _Requirements: 2.3, 3.5, 5.2, 5.5, 10.1_
  
  - [x] 5.2 Implement animateMapPan for Google Maps
    - Animate map center transitions over 350ms
    - _Requirements: 2.3_
  
  - [x] 5.3 Implement animateSheetHeight with spring option
    - Animate bottom sheet height with optional spring easing
    - _Requirements: 4.5_
  
  - [x] 5.4 Add animation cancellation support
    - Track active animations and provide cancel method
    - _Requirements: 9.4_

- [ ]* 5.5 Write property test for animation cancellation
  - **Property 14: Animation Cancellation**
  - **Validates: Requirements 9.4**

- [ ]* 5.6 Write unit tests for animation timing
  - Test that animations complete within 350ms
  - Test correct easing functions are applied
  - _Requirements: 2.3, 3.5, 5.2, 5.5, 10.1_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Enhance HotelDetailBottomSheetComponent
  - [x] 7.1 Add gesture handling integration
    - Wire up touch event handlers (touchstart, touchmove, touchend)
    - Integrate GestureRecognitionService
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 7.2 Implement multi-state expansion logic
    - Add collapsed (66.67%), expanded (90%), and dismissed (0%) states
    - Implement determineNextState based on gesture type and current state
    - _Requirements: 3.2, 4.1, 4.2, 4.3_
  
  - [x] 7.3 Implement real-time position updates during drag
    - Update sheet transform during touchmove events
    - Prevent map interactions while dragging
    - _Requirements: 4.4, 4.6, 8.2_
  
  - [x] 7.4 Implement state transition animations
    - Use AnimationService for smooth transitions
    - Apply spring easing on drag release
    - _Requirements: 4.5_
  
  - [x] 7.5 Add backdrop click handler
    - Dismiss sheet when backdrop (map area) is tapped
    - _Requirements: 5.1_
  
  - [x] 7.6 Add drag handle component
    - Create visual indicator at top of sheet
    - Style with appropriate CSS for discoverability
    - _Requirements: 3.4, 8.3_

- [ ]* 7.7 Write property test for bottom sheet state transitions
  - **Property 4: Bottom Sheet State Transitions**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**

- [ ]* 7.8 Write property test for sheet position follows touch
  - **Property 8: Sheet Position Follows Touch**
  - **Validates: Requirements 4.4, 8.2**

- [ ]* 7.9 Write property test for map interaction blocking during drag
  - **Property 9: Map Interaction Blocking During Drag**
  - **Validates: Requirements 4.6**

- [ ]* 7.10 Write property test for backdrop dismissal
  - **Property 10: Backdrop Dismissal**
  - **Validates: Requirements 5.1**

- [ ]* 7.11 Write property test for bottom sheet height states
  - **Property 18: Bottom Sheet Height States**
  - **Validates: Requirements 3.2, 4.1**

- [ ]* 7.12 Write unit tests for edge cases
  - Test rapid state transitions
  - Test drag release at various positions
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 8. Create AccessibilityService
  - [x] 8.1 Implement screen reader announcements
    - Create aria-live region management
    - Implement announceToScreenReader with polite/assertive priority
    - _Requirements: 7.1, 7.6_
  
  - [x] 8.2 Implement focus management
    - Track focus state with previousElement and currentElement
    - Implement moveFocusToSheet and restoreFocus methods
    - _Requirements: 7.2, 7.3_
  
  - [x] 8.3 Implement keyboard navigation handlers
    - Set up Tab key navigation within sheet
    - Set up Escape key dismissal
    - _Requirements: 7.4, 7.5_

- [ ]* 8.4 Write property test for focus round-trip
  - **Property 15: Focus Round-Trip**
  - **Validates: Requirements 7.2, 7.3**

- [ ]* 8.5 Write property test for keyboard navigation
  - **Property 16: Keyboard Navigation**
  - **Validates: Requirements 7.4, 7.5**

- [ ]* 8.6 Write property test for screen reader announcements
  - **Property 17: Screen Reader Announcements**
  - **Validates: Requirements 7.1, 7.6**

- [ ]* 8.7 Write unit tests for accessibility edge cases
  - Test focus trap failure and retry logic
  - Test missing aria-live region support
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 9. Wire components together in MobileLayoutComponent
  - [x] 9.1 Integrate MapInteractionStateService
    - Subscribe to state changes
    - Update component properties based on state
    - _Requirements: 9.1, 9.2_
  
  - [x] 9.2 Connect hotel selection events
    - Wire pin clicks to state service
    - Wire card clicks to state service
    - Ensure pin-card correspondence
    - _Requirements: 1.1, 1.2_
  
  - [x] 9.3 Coordinate animations on selection
    - Trigger pin highlighting, map panning, and sheet appearance simultaneously
    - Use AnimationService for coordinated timing
    - _Requirements: 2.3, 3.1, 3.5, 10.5_
  
  - [x] 9.4 Implement dismissal cleanup
    - Remove pin highlight on dismissal
    - Restore original map viewport
    - Clear selected hotel state
    - _Requirements: 5.3, 5.4, 5.5, 9.5_
  
  - [x] 9.5 Integrate accessibility features
    - Connect AccessibilityService to selection and state change events
    - Announce hotel names and state changes
    - Manage focus on sheet appearance and dismissal
    - _Requirements: 7.1, 7.2, 7.3, 7.6_

- [ ]* 9.6 Write property test for pin-card selection correspondence
  - **Property 2: Pin-Card Selection Correspondence**
  - **Validates: Requirements 1.2**

- [ ]* 9.7 Write property test for dismissal cleanup
  - **Property 11: Dismissal Cleanup**
  - **Validates: Requirements 5.3, 5.4, 9.5**

- [ ]* 9.8 Write property test for animation coordination
  - **Property 19: Animation Coordination**
  - **Validates: Requirements 10.5**

- [ ]* 9.9 Write integration tests for complete user flows
  - Test complete selection → expansion → dismissal flow
  - Test rapid selection changes
  - Test keyboard-only navigation
  - _Requirements: All_

- [x] 10. Add CSS styling and visual polish
  - [x] 10.1 Style highlighted pins
    - Add distinct visual styling for selected pins
    - Ensure sufficient contrast and visibility
    - _Requirements: 1.3, 8.1_
  
  - [x] 10.2 Style bottom sheet
    - Add rounded top corners
    - Add shadow for depth
    - Style drag handle indicator
    - _Requirements: 3.3, 8.3_
  
  - [x] 10.3 Add hardware acceleration hints
    - Apply transform and will-change CSS properties
    - Optimize for smooth animations
    - _Requirements: 10.4_

- [ ]* 10.4 Write unit tests for CSS application
  - Test correct classes are applied in each state
  - Test hardware acceleration properties
  - _Requirements: 3.3, 8.3, 10.4_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Error handling and edge cases
  - [x] 12.1 Add error handling for invalid hotel data
    - Handle missing coordinates gracefully
    - Log errors without breaking UI
    - _Requirements: 2.1_
  
  - [x] 12.2 Add error handling for map API failures
    - Implement timeout for map operations (1000ms)
    - Continue with sheet display if map fails
    - _Requirements: 2.1, 2.3_
  
  - [x] 12.3 Add error handling for inconsistent state
    - Clear selection if hotel ID not found
    - Restore to default viewport if original not stored
    - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 12.4 Write unit tests for all error conditions
  - Test invalid coordinates handling
  - Test map API timeout
  - Test inconsistent state recovery
  - _Requirements: 2.1, 9.1, 9.2, 9.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at reasonable breaks
- Property tests validate universal correctness properties (19 total)
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation follows a bottom-up approach: services → components → integration
- All animations use consistent timing (350ms) and easing (cubic-bezier)
- Accessibility is integrated throughout, not added as an afterthought
