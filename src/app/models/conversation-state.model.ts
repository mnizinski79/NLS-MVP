import { Hotel } from './hotel.model';

export type IntentType = 
  | 'location_only'
  | 'preferences_only'
  | 'complete_query'
  | 'vague'
  | 'unsupported'
  | 'show_results_now'
  | 'show_all'
  | 'cheapest'
  | 'most_expensive'
  | 'hotel_info'
  | 'refine_search';

export interface ConversationState {
  hasLocation: boolean;
  hasPreferences: boolean;
  resultCount: number;
  conversationContext: {
    location: string | null;
    brands: string[];
    sentiments: string[];
    amenities: string[];
    priceRange: {
      min: number | null;
      max: number | null;
    };
    minRating: number | null;
    checkIn: Date | null;
    checkOut: Date | null;
    guestCount: number | null;
  };
  lastIntent: IntentType | null;
  intentHistory: IntentType[];
  turnCount: number;
  lastQuery: string | null;
  lastResponse: string | null;
  lastDisplayedHotels: Hotel[];
  focusedHotel: Hotel | null; // Currently viewed hotel in detail view
}
