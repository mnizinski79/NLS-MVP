# Design Document: Mobile Map Pin Interaction

## Overview

This feature enhances the mobile map overlay experience by implementing smooth, gesture-driven interactions for viewing hotel details. When a user selects a hotel pin or card, the system coordinates three simultaneous behaviors: pin highlighting, map repositioning, and bottom sheet presentation. The design emphasizes fluid animations, intuitive touch gestures, and accessibility compliance.

The implementation builds on the existing Angular mobile layout structure, extending the map overlay component with gesture recognition and state management capabilities. The bottom sheet component will be enhanced with swipe gesture handling and multi-state expansion logic.

## Architecture

### Component Structure

```
MobileLayoutComponent (Container)
├── MapOverlayComponent (Enhanced)
│   ├── MapComponent (Enhanced with pin highlighting)
│   ├── HotelCardsScrollComponent (Existing)
│   └── HotelDetailBottomSheetComponent (Enhanced)
│       ├── DragHandleComponent (New)
│       └── HotelDetailsContentComponent (Existing)
└── GestureRecognitionService (New)
```

### State Management

The feature introduces a centralized state management approach for coordinating map, pin, and bottom sheet states:

```typescript
interface MapInteractionState {
  selectedHotelId: string | null;
  bottomSheetState: 'dismissed' | 'collapsed' | 'expanded';
  originalMapViewport: MapViewport | null;
  isAnimating: boolean;
  isDragging: boolean;
}
```

### Event Flow

1. **Selection Event**: User taps pin or card → Event captured by MapComponent or HotelCardComponent
2. **State Update**: MapInteractionState updated with selected hotel ID
3. **Parallel Actions**:
   - Pin highlighting applied via CSS class
   - Map panning/zooming initiated
   - Bottom sheet slide-up animation started
4. **Gesture Handling**: Touch events on bottom sheet processed by GestureRecognitionService
5. **State Transitions**: Swipe gestures trigger state changes with coordinated animations
6. **Dismissal**: Backdrop tap or swipe-down triggers cleanup and map restoration

## Components and Interfaces

### 1. MapInteractionStateService

Manages the centralized state for map interactions and coordinates updates across components.

```typescript
class MapInteractionStateService {
  private state: BehaviorSubject<MapInteractionState>;
  
  selectHotel(hotelId: string): void;
  dismissSelection(): void;
  setBottomSheetState(state: BottomSheetState): void;
  setDragging(isDragging: boolean): void;
  getState(): Observable<MapInteractionState>;
  getCurrentState(): MapInteractionState;
}
```

### 2. GestureRecognitionService

Processes touch events and interprets them as meaningful gestures (swipe up, swipe down, tap).

```typescript
interface GestureEvent {
  type: 'swipe-up' | 'swipe-down' | 'tap' | 'drag';
  deltaY: number;
  velocity: number;
  timestamp: number;
}

interface DragState {
  startY: number;
  currentY: number;
  startTime: number;
  velocityHistory: Array<{y: number, time: number}>;
}

class GestureRecognitionService {
  private dragState: DragState | null;
  private readonly SWIPE_THRESHOLD = 100; // pixels
  private readonly VELOCITY_THRESHOLD = 300; // pixels per second
  private readonly VELOCITY_WINDOW = 100; // ms
  
  onTouchStart(event: TouchEvent): void;
  onTouchMove(event: TouchEvent): DragState;
  onTouchEnd(event: TouchEvent): GestureEvent;
  calculateVelocity(dragState: DragState): number;
  interpretGesture(dragState: DragState): GestureEvent;
}
```

**Algorithm for Velocity Calculation**:
```
velocity = (currentY - previousY) / (currentTime - previousTime)
where previous values are from VELOCITY_WINDOW ms ago
```

**Algorithm for Gesture Interpretation**:
```
if velocity > VELOCITY_THRESHOLD:
  return 'swipe-up' if deltaY < 0 else 'swipe-down'
else if abs(deltaY) > SWIPE_THRESHOLD:
  return 'swipe-up' if deltaY < 0 else 'swipe-down'
else if abs(deltaY) < 10:
  return 'tap'
else:
  return 'drag'
```

### 3. Enhanced MapComponent

Extended to support pin highlighting and programmatic centering with offset calculations.

```typescript
interface MapViewport {
  center: {lat: number, lng: number};
  zoom: number;
}

interface PinHighlightConfig {
  selectedPinClass: string;
  normalPinClass: string;
}

class MapComponent {
  @Input() hotels: Hotel[];
  @Input() center: {lat: number, lng: number};
  @Input() zoom: number;
  @Input() selectedHotelId: string | null;
  @Output() markerClicked = new EventEmitter<string>();
  
  private map: google.maps.Map;
  private markers: Map<string, google.maps.Marker>;
  
  highlightPin(hotelId: string): void;
  clearHighlight(): void;
  centerOnHotel(hotelId: string, offsetY: number): void;
  getCurrentViewport(): MapViewport;
  restoreViewport(viewport: MapViewport): void;
  
  private calculateCenterWithOffset(
    hotelLat: number, 
    hotelLng: number, 
    offsetY: number
  ): {lat: number, lng: number};
}
```

**Algorithm for Center Calculation with Offset**:
```
Given:
- hotelLat, hotelLng: coordinates of selected hotel
- offsetY: pixel offset from top (screen height / 3)
- currentZoom: current map zoom level

Steps:
1. Convert offsetY pixels to degrees at current zoom level
   degreesPerPixel = 360 / (256 * 2^zoom)
   offsetDegrees = offsetY * degreesPerPixel

2. Calculate new center latitude
   newCenterLat = hotelLat + offsetDegrees

3. Return {lat: newCenterLat, lng: hotelLng}
```

### 4. Enhanced HotelDetailBottomSheetComponent

Extended with gesture handling, multi-state expansion, and smooth animations.

```typescript
type BottomSheetState = 'dismissed' | 'collapsed' | 'expanded';

interface SheetConfig {
  collapsedHeightPercent: number; // 66.67%
  expandedHeightPercent: number;  // 90%
  animationDuration: number;      // 350ms
  animationEasing: string;        // cubic-bezier(0.4, 0.0, 0.2, 1)
}

class HotelDetailBottomSheetComponent {
  @Input() hotel: Hotel | null;
  @Input() visible: boolean;
  @Output() closed = new EventEmitter<void>();
  @Output() stateChanged = new EventEmitter<BottomSheetState>();
  
  private currentState: BottomSheetState = 'dismissed';
  private gestureService: GestureRecognitionService;
  private stateService: MapInteractionStateService;
  private config: SheetConfig;
  
  onTouchStart(event: TouchEvent): void;
  onTouchMove(event: TouchEvent): void;
  onTouchEnd(event: TouchEvent): void;
  onBackdropClick(): void;
  
  private transitionToState(newState: BottomSheetState): void;
  private updateSheetPosition(offsetY: number): void;
  private getHeightForState(state: BottomSheetState): number;
  private determineNextState(gesture: GestureEvent): BottomSheetState;
}
```

**Algorithm for State Transition Logic**:
```
determineNextState(gesture: GestureEvent, currentState: BottomSheetState):
  if gesture.type === 'swipe-up':
    if currentState === 'collapsed':
      return 'expanded'
    else:
      return currentState
  
  else if gesture.type === 'swipe-down':
    if currentState === 'expanded':
      return 'collapsed'
    else if currentState === 'collapsed':
      return 'dismissed'
    else:
      return currentState
  
  else if gesture.type === 'drag':
    // Return to previous state if drag was insufficient
    return currentState
  
  else if gesture.type === 'tap':
    return currentState
```

### 5. AnimationService

Provides reusable animation utilities with consistent timing and easing.

```typescript
interface AnimationConfig {
  duration: number;
  easing: string;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

class AnimationService {
  private readonly DEFAULT_DURATION = 350;
  private readonly DEFAULT_EASING = 'cubic-bezier(0.4, 0.0, 0.2, 1)';
  private readonly SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  
  animateValue(
    from: number, 
    to: number, 
    config: AnimationConfig
  ): Observable<number>;
  
  animateMapPan(
    map: google.maps.Map,
    targetCenter: {lat: number, lng: number},
    duration: number
  ): Observable<void>;
  
  animateSheetHeight(
    element: HTMLElement,
    targetHeight: number,
    useSpring: boolean
  ): Observable<void>;
}
```

### 6. AccessibilityService

Manages focus, keyboard navigation, and screen reader announcements.

```typescript
interface FocusState {
  previousElement: HTMLElement | null;
  currentElement: HTMLElement | null;
}

class AccessibilityService {
  private focusState: FocusState;
  
  announceToScreenReader(message: string, priority: 'polite' | 'assertive'): void;
  moveFocusToSheet(sheetElement: HTMLElement): void;
  restoreFocus(): void;
  setupKeyboardHandlers(sheetElement: HTMLElement, onEscape: () => void): void;
  removeKeyboardHandlers(sheetElement: HTMLElement): void;
}
```

## Data Models

### MapInteractionState

```typescript
interface MapInteractionState {
  selectedHotelId: string | null;
  bottomSheetState: BottomSheetState;
  originalMapViewport: MapViewport | null;
  isAnimating: boolean;
  isDragging: boolean;
}
```

### GestureEvent

```typescript
interface GestureEvent {
  type: 'swipe-up' | 'swipe-down' | 'tap' | 'drag';
  deltaY: number;
  velocity: number;
  timestamp: number;
}
```

### DragState

```typescript
interface DragState {
  startY: number;
  currentY: number;
  startTime: number;
  velocityHistory: Array<{y: number, time: number}>;
}
```

### SheetConfig

```typescript
interface SheetConfig {
  collapsedHeightPercent: number;
  expandedHeightPercent: number;
  animationDuration: number;
  animationEasing: string;
  springEasing: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Single Pin Highlight

*For any* hotel pin selection, exactly one pin should have the highlight styling applied, and all other pins should have normal styling.

**Validates: Requirements 1.3, 1.4, 8.1**

### Property 2: Pin-Card Selection Correspondence

*For any* hotel card tap, the corresponding hotel pin on the map should be highlighted and the same hotel details should be displayed.

**Validates: Requirements 1.2**

### Property 3: Map Centering with Offset

*For any* hotel pin selection, the map center calculation should position the pin in the top third of the viewport, accounting for the bottom sheet occupying the bottom two-thirds.

**Validates: Requirements 2.1, 2.2**

### Property 4: Bottom Sheet State Transitions

*For any* swipe gesture on the bottom sheet, the state transition should follow the rules:
- Swipe-up from collapsed → expanded
- Swipe-down from expanded → collapsed  
- Swipe-down from collapsed → dismissed
- Insufficient drag → return to previous state

**Validates: Requirements 4.1, 4.2, 4.3, 4.5**

### Property 5: Gesture Recognition by Distance

*For any* drag gesture, if the absolute deltaY exceeds 100 pixels and velocity is below threshold, it should be classified as swipe-up (deltaY < -100) or swipe-down (deltaY > 100), otherwise it should return to previous state.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 6: Velocity-Based Gesture Override

*For any* drag gesture with velocity exceeding 300 pixels per second, the gesture should trigger a state transition regardless of drag distance.

**Validates: Requirements 6.4**

### Property 7: Velocity Calculation Window

*For any* drag gesture, the velocity calculation should use only touch events from the last 100ms of the drag.

**Validates: Requirements 6.5**

### Property 8: Sheet Position Follows Touch

*For any* touch move event during bottom sheet drag, the sheet position should update to follow the touch point in real-time.

**Validates: Requirements 4.4, 8.2**

### Property 9: Map Interaction Blocking During Drag

*For any* touch event on the map while the bottom sheet is being dragged, the map should not respond to the touch event.

**Validates: Requirements 4.6**

### Property 10: Backdrop Dismissal

*For any* tap on the backdrop area (map) while the bottom sheet is visible, the sheet should be dismissed.

**Validates: Requirements 5.1**

### Property 11: Dismissal Cleanup

*For any* bottom sheet dismissal, the system should remove pin highlighting, clear the selected hotel state, and restore the original map viewport.

**Validates: Requirements 5.3, 5.4, 9.5**

### Property 12: State Consistency

*For any* interaction, the system should maintain consistent state where the selected hotel ID matches the highlighted pin and the displayed bottom sheet content.

**Validates: Requirements 9.1, 9.2**

### Property 13: Original Viewport Preservation

*For any* hotel pin selection, the system should store the current map viewport before panning, and restore it exactly when the bottom sheet is dismissed.

**Validates: Requirements 9.3**

### Property 14: Animation Cancellation

*For any* new hotel selection that occurs while an animation is in progress, the system should cancel the in-progress animation and start the new animation immediately.

**Validates: Requirements 9.4**

### Property 15: Focus Round-Trip

*For any* bottom sheet appearance and dismissal cycle, focus should move to the sheet content when it appears and return to the previously focused element when dismissed.

**Validates: Requirements 7.2, 7.3**

### Property 16: Keyboard Navigation

*For any* bottom sheet in visible state, the Tab key should move focus through all interactive elements within the sheet, and the Escape key should dismiss the sheet.

**Validates: Requirements 7.4, 7.5**

### Property 17: Screen Reader Announcements

*For any* hotel pin selection or bottom sheet state change, the system should announce the hotel name and current state to screen readers via aria-live regions.

**Validates: Requirements 7.1, 7.6**

### Property 18: Bottom Sheet Height States

*For any* bottom sheet state, the height should be 66.67% of screen height when collapsed, 90% when expanded, and 0% when dismissed.

**Validates: Requirements 3.2, 4.1**

### Property 19: Animation Coordination

*For any* hotel selection, the pin highlighting, map panning, and bottom sheet appearance animations should all complete without visual conflicts.

**Validates: Requirements 10.5**

## Error Handling

### Gesture Recognition Errors

**Invalid Touch Events**: If touch events are malformed or missing required properties, the gesture recognition service should ignore them and maintain the current state rather than throwing errors.

**Rapid Gesture Sequences**: If multiple gestures occur in rapid succession (< 50ms apart), only the most recent gesture should be processed, and earlier gestures should be discarded.

### Map Interaction Errors

**Invalid Hotel Coordinates**: If a selected hotel has invalid or missing coordinates, the map should not pan, and an error should be logged. The bottom sheet should still display with available hotel information.

**Map API Failures**: If the Google Maps API fails to respond to pan/zoom commands, the system should timeout after 1000ms and proceed with showing the bottom sheet without map animation.

### Animation Errors

**Animation Interruption**: If an animation is interrupted by a new user interaction, the current animation should be cancelled cleanly, and the new animation should start from the current position rather than the target position of the cancelled animation.

**Performance Degradation**: If the device cannot maintain 60fps during animations, the system should complete animations using requestAnimationFrame fallback rather than CSS transitions.

### State Management Errors

**Inconsistent State**: If the selected hotel ID does not match any hotel in the current hotel list, the system should clear the selection and dismiss the bottom sheet.

**Missing Original Viewport**: If the original viewport is not stored when a selection occurs, the dismissal should restore to a default viewport showing all hotels rather than failing.

### Accessibility Errors

**Focus Trap Failure**: If focus cannot be moved to the bottom sheet (element not yet rendered), the system should retry after 100ms, up to 3 attempts, before logging an error.

**Screen Reader Announcement Failure**: If aria-live regions are not supported or fail to announce, the system should continue functioning normally without blocking user interactions.

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Unit Testing Focus

Unit tests should focus on:
- Specific gesture sequences (e.g., swipe up then swipe down)
- Edge cases (e.g., drag exactly 100 pixels, velocity exactly 300 px/s)
- Error conditions (e.g., invalid coordinates, missing hotel data)
- Integration points between components (e.g., state service updates triggering component changes)
- Accessibility features (e.g., focus management, keyboard shortcuts)

Avoid writing too many unit tests for scenarios that property tests will cover through randomization.

### Property-Based Testing Configuration

**Library Selection**: Use `fast-check` for TypeScript/JavaScript property-based testing.

**Test Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `Feature: mobile-map-pin-interaction, Property {number}: {property_text}`

**Property Test Implementation**:
- Each correctness property listed above must be implemented by a SINGLE property-based test
- Tests should generate random inputs (hotel data, gesture events, viewport states)
- Tests should verify the property holds for all generated inputs

### Example Property Test Structure

```typescript
describe('Property 1: Single Pin Highlight', () => {
  it('should ensure exactly one pin is highlighted after any selection', () => {
    // Feature: mobile-map-pin-interaction, Property 1: Single Pin Highlight
    fc.assert(
      fc.property(
        fc.array(hotelArbitrary, {minLength: 2, maxLength: 20}),
        fc.integer({min: 0, max: 19}),
        (hotels, selectedIndex) => {
          // Setup: render map with hotels
          const component = setupMapComponent(hotels);
          
          // Action: select a hotel
          component.selectHotel(hotels[selectedIndex].id);
          
          // Assertion: exactly one pin highlighted
          const highlightedPins = component.getHighlightedPins();
          expect(highlightedPins.length).toBe(1);
          expect(highlightedPins[0].hotelId).toBe(hotels[selectedIndex].id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Goals

- **Unit test coverage**: 80% of lines, focusing on error handling and edge cases
- **Property test coverage**: All 19 correctness properties implemented
- **Integration test coverage**: End-to-end flows for complete user journeys
- **Accessibility test coverage**: All WCAG 2.1 AA requirements verified

### Testing Tools

- **Unit testing**: Jasmine (existing Angular test framework)
- **Property-based testing**: fast-check
- **E2E testing**: Playwright or Cypress for gesture simulation
- **Accessibility testing**: axe-core for automated accessibility checks
