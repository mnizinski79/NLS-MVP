import { Component, Input, Output, EventEmitter, ViewChild, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat.component';
import { HelperTagsComponent } from './helper-tags.component';
import { InputComponent } from './input.component';
import { MapComponent } from './map.component';
import { HotelCardComponent } from './hotel-card.component';
import { HotelDetailDrawerComponent } from './hotel-detail-drawer.component';
import { Hotel } from '../models/hotel.model';
import { Message } from '../models/message.model';
import { DateSelection } from '../models/date-selection.model';
import { ViewStateMode, MapState } from '../models/view-state.model';
import { TRANSFORM_ANIMATION_CONFIG } from '../models/animation-config.model';
import { PointOfInterest } from '../models';

@Component({
  selector: 'app-desktop-layout',
  standalone: true,
  imports: [
    CommonModule,
    ChatComponent,
    HelperTagsComponent,
    InputComponent,
    MapComponent,
    HotelCardComponent,
    HotelDetailDrawerComponent
  ],
  templateUrl: './desktop-layout.component.html',
  styleUrls: ['./desktop-layout.component.css']
})
/**
 * DesktopLayoutComponent - Desktop split-screen layout
 *
 * Implements the desktop layout (width > 1024px) with:
 * - Left panel (33% width): Header, chat, helper tags, input
 * - Right panel (67% width): Map background, hotel cards (horizontal scroll), detail drawer
 *
 * Orchestrates communication between child components and passes events to parent.
 *
 * @example
 * <app-desktop-layout
 *   [messages]="messages"
 *   [hotels]="filteredHotels"
 *   [isThinking]="processing"
 *   (messageSent)="handleMessage($event)"
 *   (hotelCardClicked)="openDetails($event)">
 * </app-desktop-layout>
 */
export class DesktopLayoutComponent implements OnDestroy {
  /** Conversation messages */
  @Input() messages: Message[] = [];

  /** Whether AI is processing */
  @Input() isThinking: boolean = false;

  /** Filtered hotel results */
  @Input() hotels: Hotel[] = [];

  /** Currently selected hotel for detail view */
  @Input() selectedHotel: Hotel | null = null;

  /** Whether detail drawer is visible */
  @Input() showDetailDrawer: boolean = false;

  /** Whether input is disabled */
  @Input() inputDisabled: boolean = false;

  /** Map center coordinates */
  @Input() mapCenter: [number, number] = [40.7580, -73.9855]; // NYC default

  /** Map zoom level */
  @Input() mapZoom: number = 13;

  /** Whether user has selected dates */
  @Input() hasDates: boolean = false;

  /** Check-in date from conversation state */
  @Input() checkInDate: Date | null = null;

  /** Check-out date from conversation state */
  @Input() checkOutDate: Date | null = null;

  /** Guest count from conversation state - DEPRECATED */
  @Input() guestCount: number | null = null;
  
  /** Number of adults from conversation state */
  @Input() adults: number | null = null;
  
  /** Number of children from conversation state */
  @Input() children: number | null = null;

  /** Point of Interest from conversation state */
  @Input() pointOfInterest: PointOfInterest | null = null;

  /** Current view state mode (default, transforming, or focused) */
  viewState: ViewStateMode = 'default';

  /** Whether animations are currently running */
  isAnimating: boolean = false;

  /** Previous map state for restoration after focused view */
  previousMapState: MapState | null = null;

  /** Previously focused element for focus restoration */
  previouslyFocusedElement: HTMLElement | null = null;

  /** Active animation timeouts for cleanup */
  private animationTimeouts: number[] = [];

  /** Reference to MapComponent for direct method calls */
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  /** Reference to ChatComponent for direct method calls */
  @ViewChild(ChatComponent) chatComponent!: ChatComponent;

  /** Safe getter for chat collapsed state */
  get isChatCollapsed(): boolean {
    return this.chatComponent?.isCollapsed ?? false;
  }

  /** Emitted when user sends a message */
  @Output() messageSent = new EventEmitter<string>();

  /** Emitted when user clicks a helper tag */
  @Output() tagClicked = new EventEmitter<string>();

  /** Emitted when user clicks a hotel card */
  @Output() hotelCardClicked = new EventEmitter<Hotel>();

  /** Emitted when user clicks a map marker */
  @Output() markerClicked = new EventEmitter<Hotel>();

  /** Emitted when detail drawer is closed */
  @Output() detailDrawerClosed = new EventEmitter<void>();

  /** Emitted when user selects dates */
  @Output() dateSelected = new EventEmitter<DateSelection>();

  /** Emitted when a hotel enters focused view (detail drawer opens) */
  @Output() hotelFocused = new EventEmitter<Hotel>();

  /** Emitted when focused view is exited (detail drawer closes) */
  @Output() hotelUnfocused = new EventEmitter<void>();

  /** Emitted when user requests to select dates for a hotel */
  @Output() selectDatesRequested = new EventEmitter<Hotel>();

  /**
   * Handle message sent from input component
   */
  onMessageSent(message: string): void {
    this.messageSent.emit(message);
  }

  /**
   * Handle Escape key to close detail view
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.viewState === 'focused' && !this.isAnimating) {
      this.exitFocusedView();
    }
  }

  /**
   * Handle helper tag click
   */
  onTagClicked(query: string): void {
    this.tagClicked.emit(query);
  }

  /**
   * Handle hotel card click
   */
  /**
   * Handle hotel card click
   */
  onHotelCardClicked(hotel: Hotel): void {
    this.enterFocusedView(hotel);
  }

  /**
   * Handle map marker click
   */
  onMarkerClicked(hotel: Hotel): void {
    this.enterFocusedView(hotel);
  }

  /**
   * Handle detail drawer close
   */
  onDetailDrawerClosed(): void {
    this.exitFocusedView();
  }

  /**
   * Handle date selection
   */
  onDateSelected(selection: DateSelection): void {
    this.dateSelected.emit(selection);
  }

  /**
   * Handle select dates request from detail drawer
   */
  onSelectDatesRequested(): void {
    if (this.selectedHotel) {
      this.selectDatesRequested.emit(this.selectedHotel);
    }
  }

  /**
   * Toggle chat collapse state
   */
  toggleChatCollapse(): void {
    if (this.chatComponent) {
      this.chatComponent.toggleCollapse();
    }
  }

  /**
   * Lock user interactions during animation
   * Prevents conflicting state changes while transformations are in progress
   */
  lockInteractions(): void {
    this.isAnimating = true;
    this.inputDisabled = true;
    // Additional interaction locking will be implemented in subsequent tasks
    // (e.g., disable hotel card clicks, map interactions)
  }

  /**
   * Unlock user interactions after animation completes
   * Restores normal interaction capabilities
   */
  unlockInteractions(): void {
    this.isAnimating = false;
    this.inputDisabled = false;
    // Additional interaction unlocking will be implemented in subsequent tasks
  }

  /**
   * Announce state changes to screen readers via ARIA live region
   * @param message - Message to announce to screen reader users
   */
  announceStateChange(message: string): void {
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }

  /**
   * Slide hotel cards out (downward off-screen with fade)
   * Applies sliding-out animation class, waits for transition, then hides cards
   * @returns Promise that resolves after animation completes (350ms)
   */
  slideCardsOut(): Promise<void> {
    return new Promise((resolve) => {
      const container = document.querySelector('.hotel-cards-container');
      if (!container) {
        resolve();
        return;
      }

      // Apply sliding-out class to trigger animation
      container.classList.add('sliding-out');

      // Wait for animation to complete (350ms)
      const timeout = window.setTimeout(() => {
        // Apply hidden class after animation completes
        container.classList.add('hidden');
        resolve();
      }, 350);
      
      this.animationTimeouts.push(timeout);
    });
  }

  /**
   * Slide hotel cards in (upward from off-screen with fade)
   * Reverses the slide-out animation by removing classes
   * @returns Promise that resolves after animation completes (350ms)
   */
  slideCardsIn(): Promise<void> {
    return new Promise((resolve) => {
      const container = document.querySelector('.hotel-cards-container');
      if (!container) {
        resolve();
        return;
      }

      // Remove hidden class first to make element visible
      container.classList.remove('hidden');

      // Small delay to ensure display change is processed
      const timeout1 = window.setTimeout(() => {
        // Remove sliding-out class to trigger reverse animation
        container.classList.remove('sliding-out');

        // Wait for animation to complete (350ms)
        const timeout2 = window.setTimeout(() => {
          resolve();
        }, 350);
        
        this.animationTimeouts.push(timeout2);
      }, 10);
      
      this.animationTimeouts.push(timeout1);
    });
  }

  /**
   * Enter focused view - transform to hotel detail state
   * Coordinates simultaneous animations: cards slide out, map zooms, chat collapses
   * @param hotel - Hotel to focus on
   */
  async enterFocusedView(hotel: Hotel): Promise<void> {
    // Prevent concurrent animations
    if (this.isAnimating) {
      return;
    }

    // If already in focused view, just update the hotel and zoom map
    if (this.viewState === 'focused') {
      this.selectedHotel = hotel;
      if (this.mapComponent) {
        await this.mapComponent.expandAndZoomToHotel(hotel);
      }
      // Emit event to update focused hotel in conversation state
      this.hotelFocused.emit(hotel);
      this.announceStateChange(`Switched to ${hotel.name} details.`);
      return;
    }

    // Store currently focused element for restoration
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Lock interactions during transformation
    this.lockInteractions();
    this.viewState = 'transforming';

    // Store current map state for restoration
    if (this.mapComponent && this.mapComponent['map']) {
      const map = this.mapComponent['map'];
      this.previousMapState = {
        center: [map.getCenter().lat, map.getCenter().lng],
        zoom: map.getZoom(),
        bounds: map.getBounds()
      };
    }

    // Trigger animations simultaneously (removed chat collapse)
    await Promise.all([
      this.slideCardsOut(),
      this.mapComponent ? this.mapComponent.expandAndZoomToHotel(hotel) : Promise.resolve()
    ]);

    // Show detail drawer after animations start
    this.selectedHotel = hotel;
    this.showDetailDrawer = true;

    // Emit event to notify parent that hotel is focused
    this.hotelFocused.emit(hotel);

    // Update state and unlock interactions
    this.viewState = 'focused';
    this.unlockInteractions();

    // Announce state change to screen readers
    this.announceStateChange(`Hotel details opened for ${hotel.name}. Press Escape to close.`);

    // Move focus to drawer close button after animations
    const focusTimeout = window.setTimeout(() => {
      const drawerCloseButton = document.querySelector('.drawer .close-button') as HTMLElement;
      if (drawerCloseButton) {
        drawerCloseButton.focus();
      }
    }, 400);
    
    this.animationTimeouts.push(focusTimeout);
  }

  /**
   * Exit focused view - return to default state
   * Coordinates reverse animations: cards slide in, map restores, chat expands
   */
  async exitFocusedView(): Promise<void> {
    // Prevent concurrent animations
    if (this.isAnimating) {
      return;
    }

    // Store reference to selected hotel for focus restoration
    const hotelIdForFocus = this.selectedHotel?.id;

    // Lock interactions during transformation
    this.lockInteractions();
    this.viewState = 'transforming';

    // Hide detail drawer first
    this.showDetailDrawer = false;

    // Wait a brief moment for drawer to start closing
    const drawerTimeout = await new Promise<number>(resolve => {
      const timeout = window.setTimeout(() => resolve(timeout), 50);
    });
    this.animationTimeouts.push(drawerTimeout);

    // Trigger reverse animations simultaneously (removed chat expand)
    await Promise.all([
      this.slideCardsIn(),
      this.mapComponent ? this.mapComponent.restoreOriginalView() : Promise.resolve()
    ]);

    // Clear selected hotel and previous map state
    this.selectedHotel = null;
    this.previousMapState = null;

    // Emit event to notify parent that focused view is exited
    this.hotelUnfocused.emit();

    // Update state and unlock interactions
    this.viewState = 'default';
    this.unlockInteractions();

    // Announce state change to screen readers
    this.announceStateChange('Returned to hotel list view.');

    // Restore focus to hotel card
    const restoreFocusTimeout = window.setTimeout(() => {
      if (hotelIdForFocus) {
        const hotelCardElement = document.querySelector(`[data-hotel-id="${hotelIdForFocus}"]`) as HTMLElement;
        if (hotelCardElement) {
          hotelCardElement.focus();
        }
      } else if (this.previouslyFocusedElement) {
        // Fallback to previously focused element
        this.previouslyFocusedElement.focus();
      }
      this.previouslyFocusedElement = null;
    }, 400);
    
    this.animationTimeouts.push(restoreFocusTimeout);
  }

  /**
   * Clean up animations and reset state on component destroy
   * Prevents memory leaks and ensures clean teardown
   */
  ngOnDestroy(): void {
    // Clear all animation timeouts
    this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
    this.animationTimeouts = [];

    // Remove animation CSS classes
    const container = document.querySelector('.hotel-cards-container');
    if (container) {
      container.classList.remove('sliding-out', 'hidden');
    }

    // Reset to default state
    this.viewState = 'default';
    this.isAnimating = false;
    this.selectedHotel = null;
    this.previousMapState = null;
    this.previouslyFocusedElement = null;
    this.showDetailDrawer = false;
    this.inputDisabled = false;
  }
}
