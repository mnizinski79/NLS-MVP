import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hotel } from '../models/hotel.model';
import { PointOfInterest } from '../models/ai-response.model';
import { BRAND_COLORS, BRAND_LOGOS } from '../models/brand-config';
import { RateCalendarComponent, DateRange } from './rate-calendar.component';
import { MapComponent } from './map.component';

@Component({
  selector: 'app-hotel-detail-drawer',
  standalone: true,
  imports: [CommonModule, RateCalendarComponent, MapComponent],
  templateUrl: './hotel-detail-drawer.component.html',
  styleUrls: ['./hotel-detail-drawer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
/**
 * HotelDetailDrawerComponent - Desktop hotel details drawer
 *
 * Slide-in drawer from right side (33% width) displaying comprehensive hotel information:
 * - Image gallery with navigation
 * - Hotel name, brand, rating
 * - Description and amenities
 * - Location and contact information
 * - Pricing breakdown
 *
 * Features:
 * - Slide-in/out animation
 * - Close on backdrop click, Escape key, or close button
 * - Keyboard navigation for image gallery (arrow keys)
 * - Focus management for accessibility
 *
 * @example
 * <app-hotel-detail-drawer
 *   [hotel]="selectedHotel"
 *   [visible]="showDrawer"
 *   (closed)="closeDrawer()">
 * </app-hotel-detail-drawer>
 */
export class HotelDetailDrawerComponent implements OnChanges, AfterViewInit, OnDestroy {
  /** Hotel to display details for */
  @Input() hotel: Hotel | null = null;

  /** Whether the drawer is visible */
  @Input() visible: boolean = false;

  /** Whether dates have been selected */
  @Input() hasDates: boolean = false;

  /** Check-in date from conversation state */
  @Input() checkInDate: Date | null = null;

  /** Check-out date from conversation state */
  @Input() checkOutDate: Date | null = null;

  /** Guest count from conversation state - DEPRECATED, use adults/children */
  @Input() guestCount: number | null = null;
  
  /** Number of adults from conversation state */
  @Input() adults: number | null = 2; // Default to 2 adults
  
  /** Number of children from conversation state */
  @Input() children: number | null = 0; // Default to 0 children

  /** Point of Interest for distance calculation */
  @Input() pointOfInterest: PointOfInterest | null = null;

  /** Emitted when drawer is closed */
  @Output() closed = new EventEmitter<void>();

  /** Emitted when dates are selected */
  @Output() dateSelected = new EventEmitter<DateRange>();

  /** Emitted when user clicks "Select dates" button */
  @Output() selectDatesRequested = new EventEmitter<void>();

  /** Reference to drawer container for focus management */
  @ViewChild('drawerContainer') drawerContainer?: ElementRef;

  /** Reference to drawer content for debugging */
  @ViewChild('drawerContent') drawerContent?: ElementRef;

  /** Reference to calendar section for scrolling */
  @ViewChild('calendarSection') calendarSection?: ElementRef;

  /** Reference to rate calendar for accessing selected dates */
  @ViewChild(RateCalendarComponent) rateCalendar?: RateCalendarComponent;

  /** Current image index in gallery */
  currentImageIndex: number = 0;

  /** Whether the drawer is in closing animation state */
  isClosing: boolean = false;

  /** Whether the rate calendar page is visible */
  showRateCalendarPage: boolean = false;

  /** Whether the footer should be hidden (calendar in view) */
  hideFooter: boolean = false;

  /** Calendar expansion state */
  isCalendarExpanded: boolean = false;

  /** Track if user has modified guest counts */
  hasUserModifiedGuests: boolean = false;

  /** Cached value for complete booking info to avoid expression changed errors */
  private _hasCompleteBookingInfo: boolean = false;

  /** Previously focused element for focus restoration */
  private previouslyFocusedElement: HTMLElement | null = null;

  /** Intersection observer for calendar section */
  private calendarObserver?: IntersectionObserver;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hotel'] && this.hotel) {
      this.currentImageIndex = 0;
    }

    if (changes['visible']) {
      if (this.visible) {
        // Immediately compute booking info to avoid flash of wrong footer
        this._hasCompleteBookingInfo = this.computeCompleteBookingInfo();
        
        this.trapFocus();
        // Setup observer when drawer becomes visible
        setTimeout(() => this.setupCalendarObserver(), 200);
        // Update booking info when drawer opens
        setTimeout(() => {
          this.updateCompleteBookingInfo();
          this.cdr.detectChanges();
          
          // DEBUG: Log dimensions when drawer becomes visible
          this.logDrawerDimensions();
        }, 400);
      } else {
        this.restoreFocus();
      }
    }

    // Initialize guest count from conversation state if available
    if ((changes['adults'] || changes['children'] || changes['guestCount']) && !this.hasUserModifiedGuests) {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        // Use separate adults/children if provided, otherwise fall back to guestCount
        if (this.adults !== null || this.children !== null) {
          this.adults = this.adults ?? 2; // Default to 2 adults if not specified
          this.children = this.children ?? 0;
        } else if (this.guestCount && this.guestCount > 0) {
          // Fallback: assume all guests are adults
          this.adults = this.guestCount;
          this.children = 0;
        }
        this.updateCompleteBookingInfo();
        this.cdr.markForCheck();
      });
    }

    // Update cached booking info when inputs change (even if already visible)
    if (changes['guestCount'] || changes['checkInDate'] || changes['checkOutDate']) {
      setTimeout(() => {
        console.log('[Drawer] Input changed - updating booking info');
        console.log('[Drawer] guestCount:', this.guestCount);
        console.log('[Drawer] checkInDate:', this.checkInDate);
        console.log('[Drawer] checkOutDate:', this.checkOutDate);
        this.updateCompleteBookingInfo();
        this.cdr.detectChanges();
      }, 100);
    }
  }

  ngAfterViewInit(): void {
    console.log('[Drawer] ngAfterViewInit called');
    console.log('[Drawer] calendarSection exists:', !!this.calendarSection);
    if (this.visible) {
      this.trapFocus();
    }
    this.setupCalendarObserver();
    
    // Initialize cached booking info after a delay to ensure calendar is ready
    setTimeout(() => {
      this.updateCompleteBookingInfo();
      this.cdr.detectChanges();
      
      // DEBUG: Log content dimensions
      if (this.drawerContent) {
        const el = this.drawerContent.nativeElement;
        console.log('🔍 [DRAWER CONTENT DEBUG]');
        console.log('  clientHeight:', el.clientHeight);
        console.log('  scrollHeight:', el.scrollHeight);
        console.log('  offsetHeight:', el.offsetHeight);
        console.log('  scrollTop:', el.scrollTop);
        console.log('  scrollable?:', el.scrollHeight > el.clientHeight);
        console.log('  computed height:', window.getComputedStyle(el).height);
        console.log('  padding-bottom:', window.getComputedStyle(el).paddingBottom);
        console.log('  max scroll:', el.scrollHeight - el.clientHeight);
        
        // Add scroll listener
        el.addEventListener('scroll', () => {
          console.log('📜 SCROLL EVENT - scrollTop:', el.scrollTop, 'max:', el.scrollHeight - el.clientHeight);
        });
      } else {
        console.log('❌ drawerContent is null!');
      }
      
      if (this.calendarSection) {
        const el = this.calendarSection.nativeElement;
        console.log('🔍 [CALENDAR SECTION DEBUG]');
        console.log('  offsetTop:', el.offsetTop);
        console.log('  offsetHeight:', el.offsetHeight);
        console.log('  clientHeight:', el.clientHeight);
        console.log('  scrollHeight:', el.scrollHeight);
      }
    }, 500);
  }

  ngOnDestroy(): void {
    console.log('[Drawer] ngOnDestroy - cleaning up observer');
    if (this.calendarObserver) {
      this.calendarObserver.disconnect();
    }
  }

  private setupCalendarObserver(): void {
    console.log('[Drawer] setupCalendarObserver called');
    
    // Disconnect existing observer if any
    if (this.calendarObserver) {
      console.log('[Drawer] Disconnecting existing observer');
      this.calendarObserver.disconnect();
    }
    
    console.log('[Drawer] calendarSection exists:', !!this.calendarSection);
    if (this.calendarSection) {
      console.log('[Drawer] Creating IntersectionObserver');
      
      // Use different threshold based on booking info state
      // View Rooms state (dual buttons): hide at 80% visibility
      // Check Availability state (single button): hide at 30% visibility
      const targetThreshold = this._hasCompleteBookingInfo ? 0.8 : 0.3;
      console.log('[Drawer] Using threshold:', targetThreshold, 'hasCompleteBookingInfo:', this._hasCompleteBookingInfo);
      
      this.calendarObserver = new IntersectionObserver(
        (entries) => {
          console.log('[Drawer] IntersectionObserver callback fired, entries:', entries.length);
          entries.forEach(entry => {
            console.log('[Drawer] Entry isIntersecting:', entry.isIntersecting);
            console.log('[Drawer] Entry intersectionRatio:', entry.intersectionRatio);
            console.log('[Drawer] Entry boundingClientRect:', entry.boundingClientRect);
            console.log('[Drawer] Target threshold:', targetThreshold);
            const previousHideFooter = this.hideFooter;
            
            // Hide footer when intersection ratio meets or exceeds threshold
            // Once hidden, keep it hidden as long as element is still intersecting
            if (entry.intersectionRatio >= targetThreshold) {
              this.hideFooter = true;
            } else if (!entry.isIntersecting) {
              this.hideFooter = false;
            }
            // If intersecting but below threshold, keep current state (hysteresis)
            
            console.log('[Drawer] hideFooter set to:', this.hideFooter);
            console.log('[Drawer] _hasCompleteBookingInfo:', this._hasCompleteBookingInfo);
            
            // Only trigger change detection if the value actually changed
            if (previousHideFooter !== this.hideFooter) {
              this.cdr.detectChanges();
            }
          });
        },
        {
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
          rootMargin: '-80px 0px 0px 0px' // Account for footer height
        }
      );

      this.calendarObserver.observe(this.calendarSection.nativeElement);
      console.log('[Drawer] Observer attached to calendar section');
    } else {
      console.log('[Drawer] Calendar section not found!');
    }
  }

  /**
   * Trap focus within the drawer when opened for accessibility
   */
  private trapFocus(): void {
    // Store the currently focused element
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Focus the drawer after a short delay to ensure it's rendered
    setTimeout(() => {
      if (this.drawerContainer) {
        const focusableElements = this.drawerContainer.nativeElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        }
      }
    }, 100);
  }

  /**
   * Restore focus to the previously focused element when drawer closes
   */
  private restoreFocus(): void {
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  /**
   * Handle Escape key to close drawer
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.visible) {
      this.close();
    }
  }

  /**
   * Handle left arrow key for previous image
   */
  @HostListener('document:keydown.arrowleft', ['$event'])
  onArrowLeft(event: KeyboardEvent): void {
    if (this.visible && this.hotel && this.hotel.imageUrls.length > 1) {
      event.preventDefault();
      this.previousImage();
    }
  }

  /**
   * Handle right arrow key for next image
   */
  @HostListener('document:keydown.arrowright', ['$event'])
  onArrowRight(event: KeyboardEvent): void {
    if (this.visible && this.hotel && this.hotel.imageUrls.length > 1) {
      event.preventDefault();
      this.nextImage();
    }
  }

  /**
   * Close the drawer and emit closed event
   */
  close(): void {
    this.isClosing = true;
    // Wait for animation to complete before emitting closed event
    setTimeout(() => {
      this.isClosing = false;
      this.closed.emit();
    }, 350); // Match animation duration (350ms)
  }

  /**
   * Navigate to next image in gallery (circular)
   */
  nextImage(): void {
    if (this.hotel && this.hotel.imageUrls.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.hotel.imageUrls.length;
    }
  }

  /**
   * Navigate to previous image in gallery (circular)
   */
  previousImage(): void {
    if (this.hotel && this.hotel.imageUrls.length > 0) {
      this.currentImageIndex =
        (this.currentImageIndex - 1 + this.hotel.imageUrls.length) % this.hotel.imageUrls.length;
    }
  }

  /**
   * Get brand-specific color for styling
   * @returns Hex color code
   */
  getBrandColor(): string {
    return this.hotel ? BRAND_COLORS[this.hotel.brand] || '#000000' : '#000000';
  }

  /**
   * Get brand logo URL
   * @returns Path to logo asset
   */
  getBrandLogo(): string {
    return this.hotel ? BRAND_LOGOS[this.hotel.brand] || '' : '';
  }

  /**
   * Get array for star rating display
   * @returns Array with length equal to rating
   */
  getStarArray(): number[] {
    return this.hotel ? Array(Math.floor(this.hotel.rating)).fill(0) : [];
  }

  /**
   * Get amenities with corresponding icons
   * @returns Array of amenities with icons
   */
  getAmenitiesWithIcons(): Array<{name: string, icon: string}> {
    if (!this.hotel) return [];
    
    const iconMap: {[key: string]: string} = {
      'Pool': '🏊',
      'Fitness center': '💪',
      'Rooftop bar': '🍸',
      'Pets allowed': '🐕',
      'Free WiFi': '📶',
      'Parking': '🅿️',
      'Restaurant': '🍽️',
      'Spa': '💆',
      'Room service': '🛎️',
      'Business center': '💼'
    };

    return this.hotel.amenities.map(amenity => ({
      name: amenity,
      icon: iconMap[amenity] || '✓'
    }));
  }

  /**
   * Get thumbnail images (always returns 3 images)
   * @returns Array of 3 image URLs
   */
  getThumbnailImages(): string[] {
    if (!this.hotel || this.hotel.imageUrls.length === 0) return [];
    
    const images = this.hotel.imageUrls.slice(1, 4);
    
    // If we have fewer than 3 images, repeat from the beginning
    while (images.length < 3 && this.hotel.imageUrls.length > 0) {
      images.push(this.hotel.imageUrls[images.length % this.hotel.imageUrls.length]);
    }
    
    return images;
  }

  /**
   * Format nightly rate for display
   * @returns Formatted price string
   */
  formatPrice(): string {
    if (!this.hotel) return '';
    const { nightlyRate } = this.hotel.pricing;
    return `${nightlyRate.toFixed(0)}/night`;
  }

  /**
   * Get detailed price breakdown
   * @returns Formatted breakdown string
   */
  getPriceBreakdown(): string {
    if (!this.hotel) return '';
    const { roomRate, fees } = this.hotel.pricing;
    return `Room: ${roomRate.toFixed(0)} + Fees: ${fees.toFixed(0)}`;
  }

  /**
   * Open rate calendar page within the drawer
   */
  openRateCalendar(): void {
    this.showRateCalendarPage = true;
  }

  /**
   * Scroll to calendar section
   */
  scrollToCalendar(): void {
    console.log('[Drawer] scrollToCalendar called');
    console.log('[Drawer] calendarSection exists:', !!this.calendarSection);
    if (this.calendarSection) {
      console.log('[Drawer] Scrolling to calendar section');
      this.calendarSection.nativeElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // Log dimensions after scroll
      setTimeout(() => {
        if (this.drawerContent) {
          const el = this.drawerContent.nativeElement;
          console.log('🔍 [AFTER SCROLL - DRAWER CONTENT]');
          console.log('  scrollTop:', el.scrollTop);
          console.log('  scrollHeight:', el.scrollHeight);
          console.log('  clientHeight:', el.clientHeight);
          console.log('  maxScroll:', el.scrollHeight - el.clientHeight);
          console.log('  atBottom?:', el.scrollTop >= (el.scrollHeight - el.clientHeight - 10));
        }
      }, 1000);
    }
  }

  /**
   * Increment adult count
   */
  incrementAdults(): void {
    const currentAdults = this.adults ?? 2;
    if (currentAdults < 8) {
      this.adults = currentAdults + 1;
      this.hasUserModifiedGuests = true;
      this.updateCompleteBookingInfo();
      this.cdr.markForCheck();
    }
  }

  /**
   * Decrement adult count
   */
  decrementAdults(): void {
    const currentAdults = this.adults ?? 2;
    if (currentAdults > 1) {
      this.adults = currentAdults - 1;
      this.hasUserModifiedGuests = true;
      this.updateCompleteBookingInfo();
      this.cdr.markForCheck();
    }
  }

  /**
   * Increment children count
   */
  incrementChildren(): void {
    const currentChildren = this.children ?? 0;
    if (currentChildren < 6) {
      this.children = currentChildren + 1;
      this.hasUserModifiedGuests = true;
      this.updateCompleteBookingInfo();
      this.cdr.markForCheck();
    }
  }

  /**
   * Decrement children count
   */
  decrementChildren(): void {
    const currentChildren = this.children ?? 0;
    if (currentChildren > 0) {
      this.children = currentChildren - 1;
      this.hasUserModifiedGuests = true;
      this.updateCompleteBookingInfo();
      this.cdr.markForCheck();
    }
  }

  /**
   * Check if user has complete booking information
   * User has complete info if they have:
   * 1. Dates selected in the calendar
   * 2. Guest count either from:
   *    - Explicit conversation state (e.g., "me and 4 friends" = 5 people)
   *    - Manual interaction with guest selector
   */
  private computeCompleteBookingInfo(): boolean {
    // Check if dates are selected - prioritize input dates over calendar dates
    const hasDates = !!(
      (this.checkInDate && this.checkOutDate) || 
      (this.rateCalendar?.selectedCheckIn && this.rateCalendar?.selectedCheckOut)
    );
    
    // Check if we have a specific guest count from conversation OR user modified guests
    const hasSpecificGuestCount = (this.guestCount !== null && this.guestCount > 0) || this.hasUserModifiedGuests;
    
    return hasDates && hasSpecificGuestCount;
  }

  /**
   * Get whether user has complete booking information
   */
  hasCompleteBookingInfo(): boolean {
    return this._hasCompleteBookingInfo;
  }

  /**
   * Update the cached complete booking info value
   */
  private updateCompleteBookingInfo(): void {
    const previousValue = this._hasCompleteBookingInfo;
    this._hasCompleteBookingInfo = this.computeCompleteBookingInfo();
    
    // If the booking info state changed, recreate the observer with new threshold
    if (previousValue !== this._hasCompleteBookingInfo && this.calendarSection) {
      console.log('[Drawer] Booking info changed, recreating observer with new threshold');
      this.setupCalendarObserver();
    }
  }

  /**
   * Get formatted date range text
   */
  getDateRangeText(): string {
    // Try to get dates from rate calendar first
    let checkInDate = this.rateCalendar?.selectedCheckIn;
    let checkOutDate = this.rateCalendar?.selectedCheckOut;
    
    // Fallback to input dates if calendar dates aren't available
    if (!checkInDate && this.checkInDate) {
      checkInDate = this.checkInDate;
    }
    if (!checkOutDate && this.checkOutDate) {
      checkOutDate = this.checkOutDate;
    }
    
    if (!checkInDate || !checkOutDate) {
      return '';
    }
    
    const checkIn = checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const checkOut = checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${checkIn} - ${checkOut}`;
  }

  /**
   * Get formatted guest count text
   */
  getGuestCountText(): string {
    const parts = [];
    const adultsCount = this.adults ?? 2;
    const childrenCount = this.children ?? 0;
    
    if (adultsCount > 0) {
      parts.push(`${adultsCount} ${adultsCount === 1 ? 'Adult' : 'Adults'}`);
    }
    if (childrenCount > 0) {
      parts.push(`${childrenCount} ${childrenCount === 1 ? 'Child' : 'Children'}`);
    }
    return parts.join(', ');
  }

  /**
   * Expand calendar for editing
   */
  expandCalendar(): void {
    this.isCalendarExpanded = true;
  }

  /**
   * Collapse calendar after editing
   */
  collapseCalendar(): void {
    this.isCalendarExpanded = false;
  }

  /**
   * Go back to hotel details from rate calendar
   */
  backToHotelDetails(): void {
    this.showRateCalendarPage = false;
  }

  /**
   * Handle continue button click on calendar page
   */
  onCalendarContinue(): void {
    if (this.rateCalendar?.selectedCheckIn && this.rateCalendar?.selectedCheckOut) {
      this.onDateSelected({
        checkIn: this.rateCalendar.selectedCheckIn,
        checkOut: this.rateCalendar.selectedCheckOut
      });
    }
  }

  /**
   * Handle date selection from calendar
   */
  onDateSelected(dateRange: DateRange): void {
    this.showRateCalendarPage = false;
    this.dateSelected.emit(dateRange);
  }

  /**
   * View rooms - redirect to hotel website with selected dates
   */
  viewRooms(): void {
    console.log('=== [Drawer] viewRooms called ===');
    console.log('[Drawer] hotel:', this.hotel);
    console.log('[Drawer] hotel exists:', !!this.hotel);
    console.log('[Drawer] hotel.bookingUrl:', this.hotel?.bookingUrl);
    console.log('[Drawer] rateCalendar:', this.rateCalendar);
    console.log('[Drawer] rateCalendar exists:', !!this.rateCalendar);
    console.log('[Drawer] selectedCheckIn:', this.rateCalendar?.selectedCheckIn);
    console.log('[Drawer] selectedCheckOut:', this.rateCalendar?.selectedCheckOut);
    console.log('[Drawer] hasCompleteBookingInfo():', this.hasCompleteBookingInfo());
    console.log('[Drawer] adults:', this.adults);
    console.log('[Drawer] children:', this.children);
    
    if (!this.hotel) {
      console.error('[Drawer] ERROR: No hotel available');
      return;
    }
    
    if (!this.rateCalendar) {
      console.error('[Drawer] ERROR: No rate calendar component available');
      return;
    }
    
    if (!this.rateCalendar.selectedCheckIn || !this.rateCalendar.selectedCheckOut) {
      console.error('[Drawer] ERROR: No dates selected');
      console.log('[Drawer] selectedCheckIn:', this.rateCalendar.selectedCheckIn);
      console.log('[Drawer] selectedCheckOut:', this.rateCalendar.selectedCheckOut);
      return;
    }
    
    const checkIn = this.rateCalendar.selectedCheckIn;
    const checkOut = this.rateCalendar.selectedCheckOut;
    
    console.log('[Drawer] Using dates:', { checkIn, checkOut });
    
    // Format dates for IHG (day, month-1+year format)
    const formatIHGDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth()).padStart(2, '0'); // Month is 0-indexed (Jan=00, Feb=01, etc.)
      const year = date.getFullYear();
      return { day, monthYear: `${month}${year}` };
    };
    
    const checkInFormatted = formatIHGDate(checkIn);
    const checkOutFormatted = formatIHGDate(checkOut);
    
    console.log('[Drawer] checkInFormatted:', checkInFormatted);
    console.log('[Drawer] checkOutFormatted:', checkOutFormatted);
    
    // Use hotel's booking URL or create a generic search URL
    let bookingUrl: string;
    if (this.hotel.bookingUrl) {
      console.log('[Drawer] Using hotel booking URL');
      // Construct IHG booking URL with proper parameters
      bookingUrl = `${this.hotel.bookingUrl}&qAdlt=${this.adults}&qChld=${this.children}&qCiD=${checkInFormatted.day}&qCiMy=${checkInFormatted.monthYear}&qCoD=${checkOutFormatted.day}&qCoMy=${checkOutFormatted.monthYear}`;
    } else {
      console.log('[Drawer] No booking URL, using Google fallback');
      // Fallback to a generic hotel search
      const hotelName = encodeURIComponent(this.hotel.name);
      const checkInStr = checkIn.toLocaleDateString();
      const checkOutStr = checkOut.toLocaleDateString();
      bookingUrl = `https://www.google.com/search?q=${hotelName}+booking+${checkInStr}+to+${checkOutStr}`;
    }
    
    console.log('[Drawer] Final booking URL:', bookingUrl);
    console.log('[Drawer] Opening URL in new tab...');
    
    // Open in new tab
    const newWindow = window.open(bookingUrl, '_blank');
    console.log('[Drawer] window.open returned:', newWindow);
    
    if (!newWindow) {
      console.error('[Drawer] ERROR: Failed to open new window (popup blocked?)');
    } else {
      console.log('[Drawer] SUCCESS: New window opened');
    }
  }

  /**
   * Close rate calendar (same as back)
   */
  onCalendarClosed(): void {
    this.showRateCalendarPage = false;
  }

  /**
   * Log drawer dimensions for debugging
   */
  private logDrawerDimensions(): void {
    if (this.drawerContent) {
      const el = this.drawerContent.nativeElement;
      console.log('🔍 [DRAWER CONTENT DEBUG]');
      console.log('  clientHeight:', el.clientHeight);
      console.log('  scrollHeight:', el.scrollHeight);
      console.log('  offsetHeight:', el.offsetHeight);
      console.log('  scrollTop:', el.scrollTop);
      console.log('  scrollable?:', el.scrollHeight > el.clientHeight);
      console.log('  computed height:', window.getComputedStyle(el).height);
      console.log('  padding-bottom:', window.getComputedStyle(el).paddingBottom);
      console.log('  max scroll:', el.scrollHeight - el.clientHeight);
      console.log('  CAN SCROLL TO BOTTOM?:', (el.scrollHeight - el.clientHeight) > 0);
      
      // Add scroll listener
      el.addEventListener('scroll', () => {
        const maxScroll = el.scrollHeight - el.clientHeight;
        const atBottom = el.scrollTop >= maxScroll - 10;
        console.log('📜 SCROLL - scrollTop:', Math.round(el.scrollTop), '/ max:', Math.round(maxScroll), 'atBottom?:', atBottom);
      });
    } else {
      console.log('❌ drawerContent is STILL null!');
    }
    
    if (this.calendarSection) {
      const el = this.calendarSection.nativeElement;
      console.log('🔍 [CALENDAR SECTION DEBUG]');
      console.log('  offsetTop:', el.offsetTop);
      console.log('  offsetHeight:', el.offsetHeight);
      console.log('  clientHeight:', el.clientHeight);
      console.log('  scrollHeight:', el.scrollHeight);
    }
  }

  /**
   * Calculate distance between hotel and POI using Haversine formula
   * @returns Distance in miles, or null if no POI
   */
  getDistanceFromPOI(): string | null {
    if (!this.hotel || !this.pointOfInterest) {
      return null;
    }

    const hotelLat = this.hotel.location.coordinates.lat;
    const hotelLng = this.hotel.location.coordinates.lng;
    const poiLat = this.pointOfInterest.coordinates.lat;
    const poiLng = this.pointOfInterest.coordinates.lng;

    // Haversine formula
    const R = 3959; // Earth's radius in miles
    const dLat = (poiLat - hotelLat) * Math.PI / 180;
    const dLng = (poiLng - hotelLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(hotelLat * Math.PI / 180) * Math.cos(poiLat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Format distance
    if (distance < 0.1) {
      return 'Less than 0.1 miles';
    } else if (distance < 1) {
      return `${distance.toFixed(1)} miles`;
    } else {
      return `${distance.toFixed(1)} miles`;
    }
  }
}
