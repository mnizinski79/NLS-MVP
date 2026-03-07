import { IntentType } from './conversation-state.model';
import { SearchCriteria } from './search-criteria.model';

export interface AIResponse {
  intent: IntentType;
  message: string;
  searchCriteria?: SearchCriteria;
  shouldSearch: boolean;
  shouldRefine: boolean;
  specificHotelId?: string;
  showDatePicker?: boolean;
  checkIn?: string;  // ISO date format (YYYY-MM-DD)
  checkOut?: string; // ISO date format (YYYY-MM-DD)
  guestCount?: number; // Number of adult guests
}
