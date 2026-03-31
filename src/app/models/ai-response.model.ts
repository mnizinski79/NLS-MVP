import { IntentType } from './conversation-state.model';
import { SearchCriteria } from './search-criteria.model';

export interface PointOfInterest {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

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
  guestCount?: number; // Total number of guests (adults + children) - DEPRECATED, use adults/children
  adults?: number; // Number of adult guests
  children?: number; // Number of children
  pointOfInterest?: PointOfInterest; // POI mentioned in query (e.g., "near Central Park")
  searchSummary?: string; // Short TLDR label for search context card (e.g., "Romantic getaway", "Budget-friendly stay")
}
