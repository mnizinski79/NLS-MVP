import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../models/message.model';
import { Hotel } from '../models/hotel.model';
import { DateSelection } from '../models/date-selection.model';
import { ThinkingAnimationComponent } from './thinking-animation.component';
import { HotelCardComponent } from './hotel-card.component';
import { DatePickerComponent } from './date-picker.component';
import { RateCalendarComponent, DateRange } from './rate-calendar.component';
import { BRAND_COLORS } from '../models/brand-config';
import { MarkdownPipe } from '../pipes/markdown.pipe';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ThinkingAnimationComponent, HotelCardComponent, DatePickerComponent, RateCalendarComponent, MarkdownPipe],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
/**
 * ChatComponent - Conversation message display
 *
 * Displays the conversation history between user and AI, including:
 * - User and AI messages with different styling
 * - Thinking animation during AI processing
 * - Inline hotel cards (mobile: max 3 cards)
 * - Date picker inline display
 * - Auto-scroll to latest message
 *
 * Handles both desktop and mobile layouts with different card display strategies.
 *
 * @example
 * <app-chat
 *   [messages]="conversationMessages"
 *   [isThinking]="aiProcessing"
 *   [isMobile]="isMobileView"
 *   (dateSelected)="handleDateSelection($event)"
 *   (hotelCardClicked)="openHotelDetails($event)"
 *   (viewAllClicked)="showMapOverlay()">
 * </app-chat>
 */
export class ChatComponent {
  /** Array of conversation messages to display */
  @Input() messages: Message[] = [];

  /** Whether AI is currently processing (shows thinking animation) */
  @Input() isThinking: boolean = false;

  /** Whether in mobile layout mode */
  @Input() isMobile: boolean = false;

  /** Emitted when user selects dates from date picker */
  @Output() dateSelected = new EventEmitter<DateSelection>();

  /** Emitted when user clicks a hotel card */
  @Output() hotelCardClicked = new EventEmitter<Hotel>();

  /** Emitted when user clicks "View All" button (mobile) */
  @Output() viewAllClicked = new EventEmitter<void>();

  /** ID of message currently showing date picker */
  showDatePickerForMessage: string | null = null;

  /** Whether chat panel is collapsed to header-only state */
  isCollapsed: boolean = false;

  /**
   * Get hotels to display inline (mobile only, max 3)
   * @param message - Message containing hotels
   * @returns Array of up to 3 hotels for inline display
   */
  getInlineHotels(message: Message): Hotel[] {
    if (!message.hotels || !this.isMobile) {
      return [];
    }
    return message.hotels.slice(0, 3);
  }

  /**
   * Check if message has more than 3 hotels (show "View All" button)
   * @param message - Message to check
   * @returns True if more than 3 hotels available
   */
  hasMoreHotels(message: Message): boolean {
    return !!(message.hotels && message.hotels.length > 3);
  }

  /**
   * Handle "View All" button click
   */
  onViewAllClick(): void {
    this.viewAllClicked.emit();
  }

  /**
   * Handle hotel card click
   * @param hotel - Clicked hotel object
   */
  onCardClick(hotel: Hotel): void {
    this.hotelCardClicked.emit(hotel);
  }

  /**
   * Get date prompt message based on result count
   * If AI is asking for dates in the message, return empty string (AI message is the prompt)
   * @param message - Message with hotel results
   * @returns Contextual prompt message or empty string if AI already asked
   */
  getDatePromptMessage(message: Message): string {
    // Check if AI is already asking for dates in the message
    const isAskingForDates = /\b(dates?|check-in|check-out|when|arrival|departure)\b.*\b(mind|in mind|thinking|looking|planning)\b/i.test(message.text) ||
                            /\b(do you have|got any|have any)\b.*\b(dates?|check-in|check-out)\b/i.test(message.text);
    
    // If AI is asking for dates, don't show additional prompt (return empty string)
    if (isAskingForDates) {
      return '';
    }
    
    // Otherwise, show default prompt based on result count
    const resultCount = message.hotels?.length || 0;
    const optionText = resultCount === 1 ? 'option' : 'options';
    return `You're down to ${resultCount} great ${optionText}. Prices vary by date — want to check availability?`;
  }

  /**
   * Show date picker for a specific message
   * @param messageId - ID of message to show picker for
   */
  onSelectDatesClick(messageId: string): void {
    this.showDatePickerForMessage = messageId;
  }

  /**
   * Handle date selection from date picker
   * @param selection - Selected dates and guest count
   */
  onDatesSelected(selection: DateSelection): void {
    this.showDatePickerForMessage = null;
    this.dateSelected.emit(selection);
  }

  /**
   * Handle date picker cancellation
   */
  onDatePickerCancelled(): void {
    this.showDatePickerForMessage = null;
  }

  /**
   * Check if date picker should be shown for a message
   * @param messageId - Message ID to check
   * @returns True if picker is visible for this message
   */
  isDatePickerVisible(messageId: string): boolean {
    return this.showDatePickerForMessage === messageId;
  }

  /**
   * Collapse chat panel to header-only state
   * @returns Promise that resolves after animation completes
   */
  collapse(): Promise<void> {
    return new Promise((resolve) => {
      this.isCollapsed = true;
      // CSS transition handles animation (350ms)
      setTimeout(resolve, 350);
    });
  }

  /**
   * Expand chat panel to full state
   * @returns Promise that resolves after animation completes
   */
  expand(): Promise<void> {
    return new Promise((resolve) => {
      this.isCollapsed = false;
      // CSS transition handles animation (350ms)
      setTimeout(resolve, 350);
    });
  }

  /**
   * Toggle collapsed state (for chevron click)
   */
  toggleCollapse(): void {
    if (this.isCollapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  /**
   * Handle rate calendar date selection
   */
  onRateCalendarDatesSelected(dateRange: DateRange): void {
    this.dateSelected.emit({
      checkIn: dateRange.checkIn,
      checkOut: dateRange.checkOut
    });
  }

  /**
   * Handle rate calendar close
   */
  onRateCalendarClosed(): void {
    // Calendar closed without selection - no action needed
  }

  /**
   * Get brand color for hotel
   */
  getBrandColor(hotel: Hotel): string {
    return BRAND_COLORS[hotel.brand] || '#111827';
  }
}
