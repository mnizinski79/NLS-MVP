import { Hotel } from './hotel.model';

export interface SearchContext {
  location: string;       // e.g., "New York City"
  summary: string;        // e.g., "Hotels with a view"
  checkIn: string | null; // ISO date or null
  checkOut: string | null;
  pricingMode: 'cash' | 'points' | 'points+cash';
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  hotels?: Hotel[];
  showDatePicker?: boolean;
  showRateCalendar?: boolean;
  rateCalendarHotel?: Hotel;
  searchContext?: SearchContext;
}
