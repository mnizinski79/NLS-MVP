import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hotel } from '../models/hotel.model';
import { BRAND_COLORS, BRAND_LOGOS } from '../models/brand-config';
import { RateCalendarComponent, DateRange } from './rate-calendar.component';
import { MapComponent } from './map.component';

@Component({
  selector: 'app-hotel-detail-bottom-sheet',
  standalone: true,
  imports: [CommonModule, RateCalendarComponent, MapComponent],
  templateUrl: './hotel-detail-bottom-sheet.component.html',
  styleUrls: ['./hotel-detail-bottom-sheet.component.css']
})
export class HotelDetailBottomSheetComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() hotel: Hotel | null = null;
  @Input() visible: boolean = false;
  @Input() isMapContext: boolean = false; // True if opened from map overlay
  @Input() hasDates: boolean = false;
  @Input() checkInDate: Date | null = null;
  @Input() checkOutDate: Date | null = null;
  @Input() guestCount: number | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() dateSelected = new EventEmitter<DateRange>();
  @Output() selectDatesRequested = new EventEmitter<void>();

  @ViewChild('sheetContainer') sheetContainer?: ElementRef;
  @ViewChild('calendarSection') calendarSection?: ElementRef;
  @ViewChild(RateCalendarComponent) rateCalendar?: RateCalendarComponent;

  currentImageIndex: number = 0;
  isCollapsed: boolean = true;
  /** Whether the rate calendar page is visible */
  showRateCalendarPage: boolean = false;
  /** Whether the footer should be hidden (calendar in view) */
  hideFooter: boolean = false;
  
  /** Guest counts */
  adults: number = 2;
  children: number = 0;
  
  /** Calendar expansion state */
  isCalendarExpanded: boolean = false;
  
  /** Track if user has modified guest counts */
  hasUserModifiedGuests: boolean = false;
  
  /** Cached value for complete booking info to avoid expression changed errors */
  private _hasCompleteBookingInfo: boolean = false;
  
  isClosing: boolean = false; // Track closing animation state
  private previouslyFocusedElement: HTMLElement | null = null;
  private calendarObserver?: IntersectionObserver;

  constructor(private cdr: ChangeDetectorRef) {}

  // Gesture tracking
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private isDragging: boolean = false;
  private contentScrollTop: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hotel'] && this.hotel) {
      this.currentImageIndex = 0;
    }

    if (changes['visible']) {
      if (this.visible) {
        this.isCollapsed = true; // Reset to collapsed state when opened
        this.isClosing = false; // Reset closing state
        this.trapFocus();
        // Setup observer when sheet becomes visible
        setTimeout(() => this.setupCalendarObserver(), 200);
        // Update booking info when sheet opens
        setTimeout(() => {
          this.updateCompleteBookingInfo();
          this.cdr.detectChanges();
        }, 400);
      } else {
        this.restoreFocus();
      }
    }

    // Initialize guest count from conversation state if available
    if (changes['guestCount'] && this.guestCount !== null && this.guestCount > 0 && !this.hasUserModifiedGuests) {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        // Set adults to the guest count (assuming all are adults for simplicity)
        this.adults = this.guestCount!;
        this.children = 0;
        this.updateCompleteBookingInfo();
        this.cdr.markForCheck();
      });
    }

    // Update cached booking info when inputs change (even if already visible)
    if (changes['guestCount'] || changes['checkInDate'] || changes['checkOutDate']) {
      setTimeout(() => {
        console.log('[BottomSheet] Input changed - updating booking info');
        console.log('[BottomSheet] guestCount:', this.guestCount);
        console.log('[BottomSheet] checkInDate:', this.checkInDate);
        console.log('[BottomSheet] checkOutDate:', this.checkOutDate);
        this.updateCompleteBookingInfo();
        this.cdr.detectChanges();
      }, 100);
    }
  }

  ngAfterViewInit(): void {
    console.log('[BottomSheet] ngAfterViewInit called');
    console.log('[BottomSheet] calendarSection exists:', !!this.calendarSection);
    if (this.visible) {
      this.trapFocus();
    }
    this.setupCalendarObserver();
    
    // Initialize cached booking info after a delay to ensure calendar is ready
    setTimeout(() => {
      this.updateCompleteBookingInfo();
      this.cdr.detectChanges();
    }, 300);
  }

  ngOnDestroy(): void {
    console.log('[BottomSheet] ngOnDestroy - cleaning up observer');
    if (this.calendarObserver) {
      this.calendarObserver.disconnect();
    }
  }

  private setupCalendarObserver(): void {
    console.log('[BottomSheet] setupCalendarObserver called');
    
    // Disconnect existing observer if any
    if (this.calendarObserver) {
      console.log('[BottomSheet] Disconnecting existing observer');
      this.calendarObserver.disconnect();
    }
    
    console.log('[BottomSheet] calendarSection exists:', !!this.calendarSection);
    if (this.calendarSection) {
      console.log('[BottomSheet] Creating IntersectionObserver');
      
      // Use different threshold based on booking info state
      // View Rooms state (dual buttons): hide at 80% visibility
      // Check Availability state (single button): hide at 30% visibility
      const targetThreshold = this._hasCompleteBookingInfo ? 0.8 : 0.3;
      console.log('[BottomSheet] Using threshold:', targetThreshold, 'hasCompleteBookingInfo:', this._hasCompleteBookingInfo);
      
      this.calendarObserver = new IntersectionObserver(
        (entries) => {
          console.log('[BottomSheet] IntersectionObserver callback fired, entries:', entries.length);
          entries.forEach(entry => {
            console.log('[BottomSheet] Entry isIntersecting:', entry.isIntersecting);
            console.log('[BottomSheet] Entry intersectionRatio:', entry.intersectionRatio);
            console.log('[BottomSheet] Entry boundingClientRect:', entry.boundingClientRect);
            console.log('[BottomSheet] Target threshold:', targetThreshold);
            const previousHideFooter = this.hideFooter;
            
            // Hide footer when intersection ratio meets or exceeds threshold
            // Once hidden, keep it hidden as long as element is still intersecting
            if (entry.intersectionRatio >= targetThreshold) {
              this.hideFooter = true;
            } else if (!entry.isIntersecting) {
              this.hideFooter = false;
            }
            // If intersecting but below threshold, keep current state (hysteresis)
            
            console.log('[BottomSheet] hideFooter set to:', this.hideFooter);
            console.log('[BottomSheet] _hasCompleteBookingInfo:', this._hasCompleteBookingInfo);
            
            // Only trigger change detection if the value actually changed
            if (previousHideFooter !== this.hideFooter) {
              this.cdr.detectChanges();
            }
          });
        },
        {
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
          rootMargin: '-80px 0px 0px 0px'
        }
      );

      this.calendarObserver.observe(this.calendarSection.nativeElement);
      console.log('[BottomSheet] Observer attached to calendar section');
    } else {
      console.log('[BottomSheet] Calendar section not found!');
    }
  }

  private trapFocus(): void {
    setTimeout(() => {
      if (this.sheetContainer) {
        this.previouslyFocusedElement = document.activeElement as HTMLElement;
        const firstFocusable = this.sheetContainer.nativeElement.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
          (firstFocusable as HTMLElement).focus();
        }
      }
    }, 100);
  }

  private restoreFocus(): void {
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.visible) {
      event.preventDefault();
      this.close();
    }
  }

  @HostListener('document:keydown.arrowleft', ['$event'])
  onArrowLeft(event: KeyboardEvent): void {
    if (this.visible && this.hotel && this.hotel.imageUrls.length > 1) {
      event.preventDefault();
      this.previousImage();
    }
  }

  @HostListener('document:keydown.arrowright', ['$event'])
  onArrowRight(event: KeyboardEvent): void {
    if (this.visible && this.hotel && this.hotel.imageUrls.length > 1) {
      event.preventDefault();
      this.nextImage();
    }
  }

  close(): void {
    this.isClosing = true;
    // Wait for animation to complete before emitting closed event
    setTimeout(() => {
      this.isClosing = false;
      this.closed.emit();
    }, 300); // Match animation duration
  }

  nextImage(): void {
    if (this.hotel && this.hotel.imageUrls.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.hotel.imageUrls.length;
    }
  }

  previousImage(): void {
    if (this.hotel && this.hotel.imageUrls.length > 0) {
      this.currentImageIndex = 
        (this.currentImageIndex - 1 + this.hotel.imageUrls.length) % this.hotel.imageUrls.length;
    }
  }

  getBrandColor(): string {
    return this.hotel ? BRAND_COLORS[this.hotel.brand] || '#000000' : '#000000';
  }

  getBrandLogo(): string {
    return this.hotel ? BRAND_LOGOS[this.hotel.brand] || '' : '';
  }

  getStarArray(): number[] {
    return this.hotel ? Array(Math.floor(this.hotel.rating)).fill(0) : [];
  }

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

  getThumbnailImages(): string[] {
    if (!this.hotel || this.hotel.imageUrls.length === 0) return [];
    
    const images = this.hotel.imageUrls.slice(1, 4);
    
    while (images.length < 3 && this.hotel.imageUrls.length > 0) {
      images.push(this.hotel.imageUrls[images.length % this.hotel.imageUrls.length]);
    }
    
    return images;
  }

  formatPrice(): string {
    if (!this.hotel) return '';
    const { nightlyRate } = this.hotel.pricing;
    return `${nightlyRate.toFixed(0)}/night`;
  }

  getPriceBreakdown(): string {
    if (!this.hotel) return '';
    const { roomRate, fees } = this.hotel.pricing;
    return `Room: ${roomRate.toFixed(0)} + Fees: ${fees.toFixed(0)}`;
  }

  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('bottom-sheet-backdrop')) {
      this.close();
    }
  }

  toggleExpand(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  getSheetHeightPercent(): number {
    // Always show full screen (100%) in both map and chat contexts
    return 100;
  }

  onTouchStart(event: TouchEvent): void {
    if (!this.isMapContext) return; // Only handle gestures in map context

    const touch = event.touches[0];
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.isDragging = false;

    // Check if user is touching the drag handle area or if content is scrolled to top
    const sheetContent = this.sheetContainer?.nativeElement.querySelector('.sheet-content');
    if (sheetContent) {
      this.contentScrollTop = sheetContent.scrollTop;
    }

    // Only allow dragging if:
    // 1. Touching the drag handle area (top 60px), OR
    // 2. Content is scrolled to the top and swiping down
    const dragHandleHeight = 60;
    const isTouchingDragHandle = touch.clientY < dragHandleHeight + (window.innerHeight * (1 - this.getSheetHeightPercent() / 100));
    
    if (isTouchingDragHandle || this.contentScrollTop === 0) {
      this.isDragging = true;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isMapContext || !this.isDragging) return;

    const touch = event.touches[0];
    const deltaY = touch.clientY - this.touchStartY;

    // If content is scrolled and user is trying to scroll down, allow normal scrolling
    if (this.contentScrollTop > 0 && deltaY > 0) {
      this.isDragging = false;
      return;
    }

    // Prevent default scrolling when dragging the sheet
    if (Math.abs(deltaY) > 10) {
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isMapContext || !this.isDragging) return;

    const touch = event.changedTouches[0];
    const deltaY = touch.clientY - this.touchStartY;
    const deltaTime = Date.now() - this.touchStartTime;
    const velocity = Math.abs(deltaY) / deltaTime; // pixels per ms

    const SWIPE_THRESHOLD = 100; // pixels
    const VELOCITY_THRESHOLD = 0.3; // pixels per ms (300 px/s)

    // Only handle swipe down to dismiss (no expand/collapse states)
    const isSwipeDown = deltaY > SWIPE_THRESHOLD || (velocity > VELOCITY_THRESHOLD && deltaY > 0);

    if (isSwipeDown) {
      // Dismiss the sheet
      this.close();
    }

    this.isDragging = false;
  }

  openRateCalendar(): void {
    this.showRateCalendarPage = true;
  }

  scrollToCalendar(): void {
    console.log('[BottomSheet] scrollToCalendar called');
    console.log('[BottomSheet] calendarSection exists:', !!this.calendarSection);
    if (this.calendarSection) {
      console.log('[BottomSheet] Scrolling to calendar section');
      this.calendarSection.nativeElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  incrementAdults(): void {
    if (this.adults < 8) {
      this.adults++;
      this.hasUserModifiedGuests = true;
      this.updateCompleteBookingInfo();
      this.cdr.markForCheck();
    }
  }

  decrementAdults(): void {
    if (this.adults > 1) {
      this.adults--;
      this.hasUserModifiedGuests = true;
      this.updateCompleteBookingInfo();
      this.cdr.markForCheck();
    }
  }

  incrementChildren(): void {
    if (this.children < 6) {
      this.children++;
      this.hasUserModifiedGuests = true;
      this.updateCompleteBookingInfo();
      this.cdr.markForCheck();
    }
  }

  decrementChildren(): void {
    if (this.children > 0) {
      this.children--;
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
    // Check if dates are selected
    const hasDates = !!(this.rateCalendar?.selectedCheckIn && this.rateCalendar?.selectedCheckOut);
    
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
      console.log('[BottomSheet] Booking info changed, recreating observer with new threshold');
      this.setupCalendarObserver();
    }
  }

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

  getGuestCountText(): string {
    const parts = [];
    if (this.adults > 0) {
      parts.push(`${this.adults} ${this.adults === 1 ? 'Adult' : 'Adults'}`);
    }
    if (this.children > 0) {
      parts.push(`${this.children} ${this.children === 1 ? 'Child' : 'Children'}`);
    }
    return parts.join(', ');
  }

  expandCalendar(): void {
    this.isCalendarExpanded = true;
  }

  collapseCalendar(): void {
    this.isCalendarExpanded = false;
  }

  backToHotelDetails(): void {
    this.showRateCalendarPage = false;
  }

  onCalendarContinue(): void {
    if (this.rateCalendar?.selectedCheckIn && this.rateCalendar?.selectedCheckOut) {
      this.onDateSelected({
        checkIn: this.rateCalendar.selectedCheckIn,
        checkOut: this.rateCalendar.selectedCheckOut
      });
    }
  }

  onDateSelected(dateRange: DateRange): void {
    this.showRateCalendarPage = false;
    this.dateSelected.emit(dateRange);
  }

  viewRooms(): void {
    console.log('=== [BottomSheet] viewRooms called ===');
    console.log('[BottomSheet] hotel:', this.hotel);
    console.log('[BottomSheet] hotel exists:', !!this.hotel);
    console.log('[BottomSheet] hotel.bookingUrl:', this.hotel?.bookingUrl);
    console.log('[BottomSheet] rateCalendar:', this.rateCalendar);
    console.log('[BottomSheet] rateCalendar exists:', !!this.rateCalendar);
    console.log('[BottomSheet] selectedCheckIn:', this.rateCalendar?.selectedCheckIn);
    console.log('[BottomSheet] selectedCheckOut:', this.rateCalendar?.selectedCheckOut);
    console.log('[BottomSheet] hasCompleteBookingInfo():', this.hasCompleteBookingInfo());
    console.log('[BottomSheet] adults:', this.adults);
    console.log('[BottomSheet] children:', this.children);
    
    if (!this.hotel) {
      console.error('[BottomSheet] ERROR: No hotel available');
      return;
    }
    
    if (!this.rateCalendar) {
      console.error('[BottomSheet] ERROR: No rate calendar component available');
      return;
    }
    
    if (!this.rateCalendar.selectedCheckIn || !this.rateCalendar.selectedCheckOut) {
      console.error('[BottomSheet] ERROR: No dates selected');
      console.log('[BottomSheet] selectedCheckIn:', this.rateCalendar.selectedCheckIn);
      console.log('[BottomSheet] selectedCheckOut:', this.rateCalendar.selectedCheckOut);
      return;
    }
    
    const checkIn = this.rateCalendar.selectedCheckIn;
    const checkOut = this.rateCalendar.selectedCheckOut;
    
    console.log('[BottomSheet] Using dates:', { checkIn, checkOut });
    
    // Format dates for IHG (day, month-1+year format)
    const formatIHGDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth()).padStart(2, '0'); // Month is 0-indexed (Jan=00, Feb=01, etc.)
      const year = date.getFullYear();
      return { day, monthYear: `${month}${year}` };
    };
    
    const checkInFormatted = formatIHGDate(checkIn);
    const checkOutFormatted = formatIHGDate(checkOut);
    
    console.log('[BottomSheet] checkInFormatted:', checkInFormatted);
    console.log('[BottomSheet] checkOutFormatted:', checkOutFormatted);
    
    // Use hotel's booking URL or create a generic search URL
    let bookingUrl: string;
    if (this.hotel.bookingUrl) {
      console.log('[BottomSheet] Using hotel booking URL');
      // Construct IHG booking URL with proper parameters
      bookingUrl = `${this.hotel.bookingUrl}&qAdlt=${this.adults}&qChld=${this.children}&qCiD=${checkInFormatted.day}&qCiMy=${checkInFormatted.monthYear}&qCoD=${checkOutFormatted.day}&qCoMy=${checkOutFormatted.monthYear}`;
    } else {
      console.log('[BottomSheet] No booking URL, using Google fallback');
      // Fallback to a generic hotel search
      const hotelName = encodeURIComponent(this.hotel.name);
      const checkInStr = checkIn.toLocaleDateString();
      const checkOutStr = checkOut.toLocaleDateString();
      bookingUrl = `https://www.google.com/search?q=${hotelName}+booking+${checkInStr}+to+${checkOutStr}`;
    }
    
    console.log('[BottomSheet] Final booking URL:', bookingUrl);
    console.log('[BottomSheet] Opening URL in new tab...');
    
    // Open in new tab
    const newWindow = window.open(bookingUrl, '_blank');
    console.log('[BottomSheet] window.open returned:', newWindow);
    
    if (!newWindow) {
      console.error('[BottomSheet] ERROR: Failed to open new window (popup blocked?)');
    } else {
      console.log('[BottomSheet] SUCCESS: New window opened');
    }
  }

  onCalendarClosed(): void {
    this.showRateCalendarPage = false;
  }
}
