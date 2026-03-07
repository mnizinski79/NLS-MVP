import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  /**
   * Get Flatpickr configuration for date range selection
   * @returns Flatpickr options object configured for range mode
   */
  getFlatpickrOptions(): any {
    return {
      mode: 'range',
      minDate: 'today',
      dateFormat: 'Y-m-d',
      enableTime: false,
      altInput: true,
      altFormat: 'M j, Y',
      showMonths: 1,
      static: false,
      monthSelectorType: 'static'
    };
  }

  /**
   * Format a date range for display
   * @param checkIn Check-in date
   * @param checkOut Check-out date
   * @returns Formatted date range string
   */
  formatDateRange(checkIn: Date, checkOut: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    
    const checkInStr = checkIn.toLocaleDateString('en-US', options);
    const checkOutStr = checkOut.toLocaleDateString('en-US', options);
    
    return `${checkInStr} to ${checkOutStr}`;
  }

  /**
   * Validate a date range
   * @param checkIn Check-in date
   * @param checkOut Check-out date
   * @returns True if date range is valid, false otherwise
   */
  validateDateRange(checkIn: Date, checkOut: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    
    const checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
    
    // Check-in must be today or future
    if (checkInDate < today) {
      return false;
    }
    
    // Check-out must be after check-in
    if (checkOutDate <= checkInDate) {
      return false;
    }
    
    // Maximum stay: 30 nights
    const nights = this.calculateNights(checkIn, checkOut);
    if (nights > 30) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate the number of nights between two dates
   * @param checkIn Check-in date
   * @param checkOut Check-out date
   * @returns Number of nights
   */
  calculateNights(checkIn: Date, checkOut: Date): number {
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    
    const checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
    
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
}
