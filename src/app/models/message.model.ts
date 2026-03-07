import { Hotel } from './hotel.model';

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  hotels?: Hotel[]; // For AI messages with results
  showDatePicker?: boolean; // Trigger date picker display
  showRateCalendar?: boolean; // Trigger rate calendar display
  rateCalendarHotel?: Hotel; // Hotel for rate calendar
}
