import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
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
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css']
})
export class DatePickerComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Output() datesSelected = new EventEmitter<DateRange>();
  @Output() cancelled = new EventEmitter<void>();

  currentMonth: Date = new Date();
  calendarDays: CalendarDay[] = [];
  
  selectedCheckIn: Date | null = null;
  selectedCheckOut: Date | null = null;
  nights: number = 0;

  weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  ngOnInit(): void {
    this.initializeCalendar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.initializeCalendar();
    }
  }

  initializeCalendar(): void {
    const today = new Date();
    this.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.calendarDays = this.generateCalendarDays(this.currentMonth);
    
    // Auto-select today and tomorrow as default
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.selectedCheckIn = today;
    this.selectedCheckOut = tomorrow;
    this.updateSelection();
  }

  generateCalendarDays(month: Date): CalendarDay[] {
    const days: CalendarDay[] = [];
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
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
        isCurrentMonth: true,
        isSelected: false,
        isInRange: false,
        isCheckIn: false,
        isCheckOut: false,
        isDisabled: date < today
      });
    }
    
    // Add empty cells to complete the grid
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDate = new Date(year, monthIndex + 1, i);
      days.push({
        date: nextMonthDate,
        dayNumber: i,
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

  onDayClick(day: CalendarDay): void {
    if (day.isDisabled) return;
    
    if (!this.selectedCheckIn || (this.selectedCheckIn && this.selectedCheckOut)) {
      this.selectedCheckIn = day.date;
      this.selectedCheckOut = null;
    } 
    else if (this.selectedCheckIn && !this.selectedCheckOut) {
      if (day.date > this.selectedCheckIn) {
        this.selectedCheckOut = day.date;
      } else {
        this.selectedCheckOut = this.selectedCheckIn;
        this.selectedCheckIn = day.date;
      }
    }
    
    this.updateSelection();
  }

  updateSelection(): void {
    this.updateCalendarSelection(this.calendarDays);
    
    if (this.selectedCheckIn && this.selectedCheckOut) {
      const diffTime = this.selectedCheckOut.getTime() - this.selectedCheckIn.getTime();
      this.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      this.nights = 0;
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
    this.calendarDays = this.generateCalendarDays(this.currentMonth);
    this.updateSelection();
  }

  previousMonthView(): void {
    const today = new Date();
    const targetMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    
    if (targetMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      this.currentMonth = targetMonth;
      this.calendarDays = this.generateCalendarDays(this.currentMonth);
      this.updateSelection();
    }
  }

  getMonthYearLabel(): string {
    return this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getDateRangeLabel(): string {
    if (!this.selectedCheckIn || !this.selectedCheckOut) {
      return 'Select dates';
    }
    
    const checkInStr = this.selectedCheckIn.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
    const checkOutStr = this.selectedCheckOut.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
    
    return `${checkInStr} - ${checkOutStr}`;
  }

  onApply(): void {
    if (this.selectedCheckIn && this.selectedCheckOut) {
      this.datesSelected.emit({
        checkIn: this.selectedCheckIn,
        checkOut: this.selectedCheckOut
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  canGoBack(): boolean {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return this.currentMonth > currentMonthStart;
  }
}
