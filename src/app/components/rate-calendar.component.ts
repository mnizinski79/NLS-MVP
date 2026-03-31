import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hotel } from '../models/hotel.model';
import { BRAND_LOGOS } from '../models/brand-config';
import { PricingService } from '../services/pricing.service';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  price: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isCheckIn: boolean;
  isCheckOut: boolean;
  isDisabled: boolean;
}

export interface DateRange {
  checkIn: Date;
  checkOut: Date;
}

@Component({
  selector: 'app-rate-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rate-calendar.component.html',
  styleUrls: ['./rate-calendar.component.css']
})
export class RateCalendarComponent implements OnInit, OnChanges {
  @Input() hotel: Hotel | null = null; // Hotel information for header
  @Input() basePrice: number = 200; // Base nightly rate
  @Input() visible: boolean = false;
  @Input() inline: boolean = false; // Whether calendar is inline in chat (no overlay)
  @Input() initialCheckIn: Date | null = null; // Initial check-in date from conversation
  @Input() initialCheckOut: Date | null = null; // Initial check-out date from conversation
  @Input() brandColor: string = '#1F4456'; // Brand color for selected dates
  @Output() dateSelected = new EventEmitter<DateRange>();
  @Output() closed = new EventEmitter<void>();

  currentMonth: Date = new Date();
  nextMonth: Date = new Date();
  calendarDays: CalendarDay[] = [];
  nextMonthDays: CalendarDay[] = [];
  
  selectedCheckIn: Date | null = null;
  selectedCheckOut: Date | null = null;
  nights: number = 1;
  totalPrice: number = 0;

  weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  constructor(public pricing: PricingService) {}

  ngOnInit(): void {
    this.initializeCalendar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.initializeCalendar();
    }
    
    // Update selected dates when initial dates change
    if ((changes['initialCheckIn'] || changes['initialCheckOut']) && 
        this.initialCheckIn && this.initialCheckOut) {
      this.selectedCheckIn = new Date(this.initialCheckIn);
      this.selectedCheckIn.setHours(0, 0, 0, 0);
      this.selectedCheckOut = new Date(this.initialCheckOut);
      this.selectedCheckOut.setHours(0, 0, 0, 0);
      this.updateSelection();
    }
  }

  initializeCalendar(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight
    
    this.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    this.calendarDays = this.generateCalendarDays(this.currentMonth);
    this.nextMonthDays = this.generateCalendarDays(this.nextMonth);
    
    // Use initial dates if provided, otherwise auto-select today and tomorrow
    if (this.initialCheckIn && this.initialCheckOut) {
      this.selectedCheckIn = new Date(this.initialCheckIn);
      this.selectedCheckIn.setHours(0, 0, 0, 0);
      this.selectedCheckOut = new Date(this.initialCheckOut);
      this.selectedCheckOut.setHours(0, 0, 0, 0);
    } else {
      // Default: check-in today, check-out tomorrow
      this.selectedCheckIn = new Date(today);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.selectedCheckOut = tomorrow;
    }
    
    this.updateSelection();
  }

  generateCalendarDays(month: Date): CalendarDay[] {
    const days: CalendarDay[] = [];
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDate = new Date(year, monthIndex, -(startingDayOfWeek - i - 1));
      days.push({
        date: prevMonthDate,
        dayNumber: prevMonthDate.getDate(),
        price: this.generatePrice(),
        isCurrentMonth: false,
        isSelected: false,
        isInRange: false,
        isCheckIn: false,
        isCheckOut: false,
        isDisabled: true
      });
    }
    
    // Add days of current month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      date.setHours(0, 0, 0, 0);
      
      days.push({
        date,
        dayNumber: day,
        price: this.generatePrice(),
        isCurrentMonth: true,
        isSelected: false,
        isInRange: false,
        isCheckIn: false,
        isCheckOut: false,
        isDisabled: date < today
      });
    }
    
    // Add empty cells to complete the grid (6 rows x 7 days = 42 cells)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDate = new Date(year, monthIndex + 1, i);
      days.push({
        date: nextMonthDate,
        dayNumber: i,
        price: this.generatePrice(),
        isCurrentMonth: false,
        isSelected: false,
        isInRange: false,
        isCheckIn: false,
        isCheckOut: false,
        isDisabled: true
      });
    }
    
    return days;
  }

  generatePrice(): number {
    // Generate realistic price variations (±20% of base price)
    const variation = (Math.random() - 0.5) * 0.4; // -20% to +20%
    const price = this.basePrice * (1 + variation);
    return Math.round(price);
  }

  onDayClick(day: CalendarDay): void {
    if (day.isDisabled) return;
    
    // If no check-in selected, or both dates selected, start new selection
    if (!this.selectedCheckIn || (this.selectedCheckIn && this.selectedCheckOut)) {
      this.selectedCheckIn = day.date;
      this.selectedCheckOut = null;
    } 
    // If check-in selected but no check-out, set check-out
    else if (this.selectedCheckIn && !this.selectedCheckOut) {
      if (day.date > this.selectedCheckIn) {
        this.selectedCheckOut = day.date;
      } else {
        // If clicked date is before check-in, swap them
        this.selectedCheckOut = this.selectedCheckIn;
        this.selectedCheckIn = day.date;
      }
    }
    
    this.updateSelection();
  }

  updateSelection(): void {
    // Update all calendar days
    this.updateCalendarSelection(this.calendarDays);
    this.updateCalendarSelection(this.nextMonthDays);
    
    // Calculate nights and total price
    if (this.selectedCheckIn && this.selectedCheckOut) {
      const diffTime = this.selectedCheckOut.getTime() - this.selectedCheckIn.getTime();
      this.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.totalPrice = this.nights * this.basePrice;
    } else {
      this.nights = 1;
      this.totalPrice = this.basePrice;
    }
  }

  updateCalendarSelection(days: CalendarDay[]): void {
    days.forEach(day => {
      const dayTime = day.date.getTime();
      const checkInTime = this.selectedCheckIn?.getTime() || 0;
      const checkOutTime = this.selectedCheckOut?.getTime() || 0;
      
      day.isCheckIn = this.selectedCheckIn ? dayTime === checkInTime : false;
      day.isCheckOut = this.selectedCheckOut ? dayTime === checkOutTime : false;
      day.isInRange = this.selectedCheckIn && this.selectedCheckOut 
        ? dayTime > checkInTime && dayTime < checkOutTime
        : false;
      day.isSelected = day.isCheckIn || day.isCheckOut;
    });
  }

  nextMonthView(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.nextMonth = new Date(this.nextMonth.getFullYear(), this.nextMonth.getMonth() + 1, 1);
    this.calendarDays = this.generateCalendarDays(this.currentMonth);
    this.nextMonthDays = this.generateCalendarDays(this.nextMonth);
    this.updateSelection();
  }

  previousMonthView(): void {
    const today = new Date();
    const targetMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    
    // Don't go before current month
    if (targetMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      this.currentMonth = targetMonth;
      this.nextMonth = new Date(this.nextMonth.getFullYear(), this.nextMonth.getMonth() - 1, 1);
      this.calendarDays = this.generateCalendarDays(this.currentMonth);
      this.nextMonthDays = this.generateCalendarDays(this.nextMonth);
      this.updateSelection();
    }
  }

  getMonthYearLabel(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getDateRangeLabel(): string {
    if (!this.selectedCheckIn || !this.selectedCheckOut) {
      return 'Select dates';
    }
    
    const checkInStr = this.selectedCheckIn.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    const checkOutStr = this.selectedCheckOut.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    return `${checkInStr} - ${checkOutStr}`;
  }

  onContinue(): void {
    if (this.selectedCheckIn && this.selectedCheckOut) {
      this.dateSelected.emit({
        checkIn: this.selectedCheckIn,
        checkOut: this.selectedCheckOut
      });
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  canGoBack(): boolean {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return this.currentMonth > currentMonthStart;
  }

  getBrandLogo(hotel: Hotel): string {
    return BRAND_LOGOS[hotel.brand] || 'assets/logos/independent-logo.png';
  }
}
