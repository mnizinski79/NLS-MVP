# Design Document: Desktop Hotel Detail Transform

## Overview

This feature transforms the desktop hotel detail view from a modal overlay pattern to a page transformation pattern. When a user clicks a hotel card, three simultaneous animations create a focused hotel view: hotel cards slide down off-screen, the map expands and zooms to the selected hotel, and the chat panel collapses to a minimal header-only state. The hotel detail panel slides in from the right without any backdrop overlay, creating a seamless transition that feels like the page is transforming rather than opening a modal.

The transformation is fully reversible - closing the detail view restores all three components to their original state with smooth animations. All animations are coordinated to complete within 300-400ms while maintaining 60fps performance.

## Architecture

### Component Structure

The feature modifies the existing `DesktopLayoutComponent` and its child components:

```
DesktopLayoutComponent
├── Left Panel (Chat)
│   ├── ChatComponent (collapsible)
│   └── InputComponent
└── Right Panel (Map + Cards)
    ├── MapComponent (expandable/zoomable)
    ├── Hotel Cards Container (slideable)
    └── HotelDetailDrawerComponent (no backdrop)
```

### State Management

A new state management system tracks the transformation state:

**States:**
- `default`: Normal view with visible cards, default map zoom, expanded chat
- `transforming`: Transition in progress (animations running)
- `focused`: Hotel detail view with hidden cards, zoomed map, collapsed chat

**State Transitions:**
- `default → transforming → focused`: User clicks hotel card
- `focused → transforming → default`: User closes detail panel

### Animation Coordination

All three animations (cards, map, chat) are coordinated through a central animation orchestrator that:
1. Triggers all animations simultaneously
2. Tracks animation completion
3. Updates component states
4. Prevents conflicting user interactions during transitions

## Components and Interfaces

### 1. DesktopLayoutComponent (Modified)

**New Properties:**
```typescript
viewState: 'default' | 'transforming' | 'focused' = 'default';
isAnimating: boolean = false;
previousMapState: { center: [number, number], zoom: number } | null = null;
```

**New Methods:**
```typescript
// Trigger transformation to focused state
enterFocusedView(hotel: Hotel): void

// Reverse transformation to default state
exitFocusedView(): void

// Coordinate all three animations
coordinateTransformAnimations(direction: 'enter' | 'exit'): Promise<void>

// Prevent interactions during animation
lockInteractions(): void
unlockInteractions(): void
```

### 2. ChatComponent (Modified)

**New Properties:**
```typescript
isCollapsed: boolean = false;
collapsedHeight: string = '60px'; // Header height only
```

**New Methods:**
```typescript
// Collapse to header-only state
collapse(): Promise<void>

// Expand to full state
expand(): Promise<void>

// Toggle collapsed state (for chevron click)
toggleCollapse(): void
```

**Template Changes:**
- Add chevron icon to header (visible when collapsed)
- Add CSS classes for collapsed state
- Hide messages and input when collapsed

### 3. MapComponent (Modified)

**New Properties:**
```typescript
focusedHotel: Hotel | null = null;
isExpanded: boolean = false;
```

**New Methods:**
```typescript
// Expand map and zoom to hotel
expandAndZoomToHotel(hotel: Hotel): Promise<void>

// Restore original map state
restoreOriginalView(previousState: { center: [number, number], zoom: number }): Promise<void>

// Highlight specific hotel marker
highlightMarker(hotel: Hotel): void

// Remove marker highlight
clearHighlight(): void
```

**Implementation Details:**
- Use Leaflet's `flyTo()` method for smooth zoom/pan animation
- Target zoom level: 15-16
- Animation duration: 300-400ms
- Apply custom styling to highlighted marker

### 4. HotelDetailDrawerComponent (Modified)

**Changes:**
- Remove backdrop element entirely
- Adjust z-index to work without backdrop
- Maintain slide-in animation from right
- Keep all existing functionality (close button, keyboard nav, etc.)

**CSS Changes:**
```css
/* Remove backdrop styles */
/* .backdrop { ... } - DELETE */

/* Adjust drawer z-index */
.drawer {
  z-index: 50; /* No backdrop needed */
}
```

### 5. Hotel Cards Container (Modified in DesktopLayoutComponent)

**New CSS Classes:**
```css
.hotel-cards-container {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.hotel-cards-container.sliding-out {
  transform: translateY(100%);
  opacity: 0;
}

.hotel-cards-container.hidden {
  display: none;
}
```

**Animation Sequence:**
1. Add `sliding-out` class
2. Wait for transition (300ms)
3. Add `hidden` class
4. Reverse for restoration

## Data Models

### ViewState Interface

```typescript
interface ViewState {
  mode: 'default' | 'transforming' | 'focused';
  isAnimating: boolean;
  focusedHotel: Hotel | null;
  previousMapState: MapState | null;
}

interface MapState {
  center: [number, number];
  zoom: number;
  bounds: L.LatLngBounds | null;
}
```

### Animation Configuration

```typescript
interface AnimationConfig {
  duration: number; // 300-400ms
  easing: string; // 'ease-out'
  useGPU: boolean; // true - use transform/opacity
}

const TRANSFORM_ANIMATION_CONFIG: AnimationConfig = {
  duration: 350,
  easing: 'ease-out',
  useGPU: true
};
```

## Implementation Details

### Animation Coordination Flow

**Enter Focused View:**
```typescript
async enterFocusedView(hotel: Hotel): Promise<void> {
  if (this.isAnimating) return; // Prevent concurrent animations
  
  this.lockInteractions();
  this.viewState = 'transforming';
  this.isAnimating = true;
  
  // Store current map state for restoration
  this.previousMapState = {
    center: this.mapCenter,
    zoom: this.mapZoom,
    bounds: this.map.getBounds()
  };
  
  // Trigger all three animations simultaneously
  await Promise.all([
    this.slideCardsOut(),
    this.expandAndZoomMap(hotel),
    this.collapseChat()
  ]);
  
  // Show detail drawer after other animations start
  this.selectedHotel = hotel;
  this.showDetailDrawer = true;
  
  this.viewState = 'focused';
  this.isAnimating = false;
  this.unlockInteractions();
}
```

**Exit Focused View:**
```typescript
async exitFocusedView(): Promise<void> {
  if (this.isAnimating) return;
  
  this.lockInteractions();
  this.viewState = 'transforming';
  this.isAnimating = true;
  
  // Hide detail drawer first
  this.showDetailDrawer = false;
  
  // Wait for drawer slide-out, then reverse other animations
  await this.waitForDrawerClose();
  
  await Promise.all([
    this.slideCardsIn(),
    this.restoreMapView(),
    this.expandChat()
  ]);
  
  this.selectedHotel = null;
  this.previousMapState = null;
  this.viewState = 'default';
  this.isAnimating = false;
  this.unlockInteractions();
}
```

### CSS Transform Strategy

Use GPU-accelerated properties for smooth 60fps animations:

**Hotel Cards:**
```css
/* Use transform instead of top/bottom */
.hotel-cards-container {
  transform: translateY(0);
  opacity: 1;
  transition: transform 350ms ease-out, opacity 350ms ease-out;
  will-change: transform, opacity;
}

.hotel-cards-container.sliding-out {
  transform: translateY(100%);
  opacity: 0;
}
```

**Chat Panel:**
```css
.chat-container {
  max-height: 100%;
  opacity: 1;
  transition: max-height 350ms ease-out, opacity 350ms ease-out;
  overflow: hidden;
  will-change: max-height, opacity;
}

.chat-container.collapsed {
  max-height: 60px; /* Header only */
  opacity: 0.95;
}
```

**Map Container:**
```css
.map-container {
  transition: height 350ms ease-out;
  will-change: height;
}

.map-container.expanded {
  height: 100%; /* Fill space from cards */
}
```

### Leaflet Map Animation

```typescript
async expandAndZoomToHotel(hotel: Hotel): Promise<void> {
  const targetZoom = 15.5;
  const targetCenter: [number, number] = [
    hotel.location.coordinates.lat,
    hotel.location.coordinates.lng
  ];
  
  // Leaflet's flyTo provides smooth animation
  return new Promise((resolve) => {
    this.map.flyTo(targetCenter, targetZoom, {
      duration: 0.35, // 350ms
      easing: (t) => t * (2 - t) // ease-out
    });
    
    // Highlight the hotel marker
    this.highlightMarker(hotel);
    
    // Resolve after animation completes
    setTimeout(resolve, 350);
  });
}
```

### Chat Collapse Implementation

```typescript
// In ChatComponent
async collapse(): Promise<void> {
  return new Promise((resolve) => {
    this.isCollapsed = true;
    // CSS transition handles animation
    setTimeout(resolve, 350);
  });
}

async expand(): Promise<void> {
  return new Promise((resolve) => {
    this.isCollapsed = false;
    setTimeout(resolve, 350);
  });
}
```

**Template:**
```html
<div class="chat-container" [class.collapsed]="isCollapsed">
  <div class="chat-header">
    <h2>Chat</h2>
    <button 
      *ngIf="isCollapsed" 
      (click)="toggleCollapse()"
      class="expand-button"
      aria-label="Expand chat">
      <svg><!-- Chevron down icon --></svg>
    </button>
  </div>
  
  <div class="chat-messages" *ngIf="!isCollapsed">
    <!-- Messages -->
  </div>
  
  <div class="chat-input" *ngIf="!isCollapsed">
    <!-- Input -->
  </div>
</div>
```

### Interaction Locking

```typescript
lockInteractions(): void {
  // Disable hotel card clicks
  this.hotels.forEach(hotel => hotel.clickable = false);
  
  // Disable map marker clicks
  this.map.dragging.disable();
  this.map.touchZoom.disable();
  this.map.doubleClickZoom.disable();
  this.map.scrollWheelZoom.disable();
  
  // Disable input
  this.inputDisabled = true;
}

unlockInteractions(): void {
  this.hotels.forEach(hotel => hotel.clickable = true);
  this.map.dragging.enable();
  this.map.touchZoom.enable();
  this.map.doubleClickZoom.enable();
  this.map.scrollWheelZoom.enable();
  this.inputDisabled = false;
}
```

### Accessibility Implementation

**Keyboard Navigation:**
```typescript
@HostListener('document:keydown.escape')
onEscapeKey(): void {
  if (this.viewState === 'focused' && !this.isAnimating) {
    this.exitFocusedView();
  }
}
```

**Focus Management:**
```typescript
async enterFocusedView(hotel: Hotel): Promise<void> {
  // ... animation code ...
  
  // Move focus to detail drawer after animations
  setTimeout(() => {
    const drawerCloseButton = document.querySelector('.drawer .close-button') as HTMLElement;
    drawerCloseButton?.focus();
  }, 400);
}

async exitFocusedView(): Promise<void> {
  // Store reference to focused hotel card
  const hotelCardElement = document.querySelector(`[data-hotel-id="${this.selectedHotel?.id}"]`) as HTMLElement;
  
  // ... animation code ...
  
  // Restore focus to hotel card
  setTimeout(() => {
    hotelCardElement?.focus();
  }, 400);
}
```

**ARIA Announcements:**
```typescript
announceStateChange(message: string): void {
  const liveRegion = document.getElementById('aria-live-region');
  if (liveRegion) {
    liveRegion.textContent = message;
  }
}

// Usage:
this.announceStateChange('Hotel details opened. Press Escape to close.');
this.announceStateChange('Returned to hotel list view.');
```

**Template Addition:**
```html
<!-- Add to DesktopLayoutComponent template -->
<div 
  id="aria-live-region" 
  class="sr-only" 
  role="status" 
  aria-live="polite" 
  aria-atomic="true">
</div>
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Complete Transformation Round Trip

*For any* initial desktop layout state (with specific map center, zoom, visible cards, and expanded chat), transforming to focused view then back to default should restore all components to their original state: cards visible at original position, map at original center and zoom, and chat expanded.

**Validates: Requirements 1.4, 2.5, 3.6, 5.3, 5.4**

### Property 2: Hotel Cards Slide and Fade

*For any* set of hotel cards, when entering focused view, all cards should simultaneously receive the sliding-out transform (translateY(100%)) and opacity fade (opacity: 0), and after animation completion, the container should be hidden (display: none or visibility: hidden).

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 3: Map Zoom to Hotel Coordinates

*For any* hotel with valid coordinates, when entering focused view for that hotel, the map should zoom to level 15-16 and center on the hotel's exact coordinates, and the hotel's marker should be highlighted.

**Validates: Requirements 2.2, 2.3**

### Property 4: Map Expansion Fills Card Space

*For any* desktop layout, when hotel cards slide out, the map container height should increase to fill the space previously occupied by the cards.

**Validates: Requirements 2.1**

### Property 5: Chat Collapse to Header Only

*For any* chat panel state, when entering focused view, the chat should collapse to show only the header bar (approximately 60px height), hide messages and input sections, and display a chevron icon for re-expansion.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Chat Chevron Expansion

*For any* collapsed chat panel, clicking the chevron icon should expand the chat to its original full state with messages and input visible.

**Validates: Requirements 3.5**

### Property 7: Simultaneous Animation Start

*For any* transformation trigger (entering or exiting focused view), all three component animations (cards, map, chat) should begin in the same execution frame or within 16ms of each other.

**Validates: Requirements 2.4, 3.4**

### Property 8: Animation Timing Constraints

*For any* animation in the transformation (cards slide, map zoom, chat collapse, detail panel slide), the animation duration should be between 300ms and 400ms.

**Validates: Requirements 1.5, 2.6, 3.7, 4.4, 5.5, 6.4**

### Property 9: No Backdrop Display

*For any* focused view state with visible hotel detail panel, there should be no backdrop or dark overlay element present in the DOM or visible on screen.

**Validates: Requirements 4.2**

### Property 10: Detail Panel Slide Direction

*For any* hotel selection, the detail panel should slide in from the right (transform: translateX(0) from translateX(100%)), and when closing, should slide out to the right (transform: translateX(100%)).

**Validates: Requirements 4.1, 5.2**

### Property 11: Animation Sequencing

*For any* transformation to focused view, the detail panel slide-in animation should begin after (or simultaneously with) the card, map, and chat animations start.

**Validates: Requirements 4.3**

### Property 12: Transform State Consistency

*For any* time during focused view (while detail panel is visible), the system state should maintain: cards hidden, map zoomed to hotel, chat collapsed, and viewState = 'focused'.

**Validates: Requirements 4.5, 8.4**

### Property 13: GPU-Accelerated Properties

*For any* animation in the transformation, the CSS properties being animated should be limited to 'transform', 'opacity', 'max-height', or other GPU-accelerated properties, and should not animate 'top', 'left', 'width', or 'height' directly.

**Validates: Requirements 6.2**

### Property 14: Keyboard Hotel Selection

*For any* hotel card with focus, pressing Enter or Space key should trigger the same transformation to focused view as clicking the card.

**Validates: Requirements 7.1**

### Property 15: Focus Management Round Trip

*For any* focused element before opening detail panel, after the complete transformation cycle (open then close), keyboard focus should return to that same element.

**Validates: Requirements 7.2, 7.3**

### Property 16: ARIA Live Region Updates

*For any* state transition (entering or exiting focused view), the ARIA live region should be updated with an appropriate announcement message describing the state change.

**Validates: Requirements 7.4**

### Property 17: Collapsed Chat Keyboard Access

*For any* collapsed chat state, the chevron expand button should be keyboard-focusable and activatable with Enter or Space key.

**Validates: Requirements 7.5**

### Property 18: Escape Key Closes Detail

*For any* focused view state (detail panel open), pressing the Escape key should trigger the exit transformation and return to default state.

**Validates: Requirements 7.6**

### Property 19: View State Tracking

*For any* point in the application lifecycle, the viewState variable should accurately reflect the current state: 'default' when no hotel is selected, 'transforming' during animations, and 'focused' when detail panel is fully visible.

**Validates: Requirements 8.1**

### Property 20: Interaction Locking During Animation

*For any* transforming state (isAnimating = true), user interactions that could trigger state changes (hotel card clicks, map marker clicks, input submission) should be disabled or ignored.

**Validates: Requirements 8.2, 8.3**

## Error Handling

### Animation Interruption

If an animation is interrupted (e.g., user navigates away, component unmounts):
- Clean up all animation timers and promises
- Remove all animation-related CSS classes
- Reset component states to a consistent state (prefer default state)
- Restore user interaction capabilities

### Invalid Hotel Data

If a hotel lacks required coordinate data:
- Log error to console
- Fall back to default map center
- Still perform card and chat animations
- Display error message in detail panel

### Map Library Errors

If Leaflet map operations fail:
- Catch and log errors
- Continue with card and chat animations
- Display fallback static map or error message
- Ensure detail panel still opens

### Browser Animation Support

If CSS transitions are not supported:
- Detect using feature detection
- Fall back to instant state changes (no animation)
- Maintain functional behavior
- Log warning for debugging

### Focus Management Failures

If focus restoration fails (element no longer exists):
- Fall back to focusing the first focusable element in the viewport
- Log warning for debugging
- Ensure keyboard navigation remains functional

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) to implement the correctness properties defined above.

**Configuration:**
- Minimum 100 iterations per property test (due to randomization)
- Each test must reference its design document property
- Tag format: `// Feature: desktop-hotel-detail-transform, Property {number}: {property_text}`

**Example Property Test Structure:**

```typescript
import fc from 'fast-check';

describe('Desktop Hotel Detail Transform - Property Tests', () => {
  it('Property 1: Complete Transformation Round Trip', () => {
    // Feature: desktop-hotel-detail-transform, Property 1: Complete Transformation Round Trip
    fc.assert(
      fc.property(
        fc.record({
          mapCenter: fc.tuple(fc.float(), fc.float()),
          mapZoom: fc.integer({ min: 10, max: 18 }),
          hotels: fc.array(hotelArbitrary, { minLength: 1, maxLength: 10 })
        }),
        async (initialState) => {
          // Setup: Create component with initial state
          // Action: Transform to focused view then back
          // Assert: All components restored to initial state
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Focus Areas

Unit tests should focus on:

1. **Specific Animation Sequences**
   - Test exact CSS class application order
   - Verify animation event listeners
   - Test animation completion callbacks

2. **Edge Cases**
   - Empty hotel list
   - Single hotel
   - Hotel with missing images
   - Very long hotel names
   - Extreme map coordinates

3. **Error Conditions**
   - Map initialization failure
   - Animation interruption
   - Component unmount during animation
   - Invalid hotel data

4. **Integration Points**
   - Parent-child component communication
   - Event emission and handling
   - State synchronization between components

5. **Accessibility Specifics**
   - Screen reader announcement content
   - Focus trap behavior
   - Keyboard shortcut conflicts

### Testing Tools

- **Jasmine/Karma**: Unit test framework (existing Angular setup)
- **fast-check**: Property-based testing library
- **@angular/core/testing**: Angular testing utilities
- **Leaflet testing utilities**: Mock map interactions

### Test Coverage Goals

- Minimum 90% code coverage for new/modified code
- 100% coverage of error handling paths
- All 20 correctness properties implemented as property tests
- Comprehensive unit tests for edge cases and integration points
