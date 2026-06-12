export interface Hotel {
  id: string;
  name: string;
  brand: 'Kimpton' | 'voco' | 'InterContinental' | 'Holiday Inn' | 'Independent';
  rating: number; // 1-5 stars
  location: {
    address: string;
    neighborhood: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  pricing: {
    nightlyRate: number;
    roomRate: number;
    fees: number;
    allInNightly: number; // derived: roomRate + fees
  };
  amenities: string[]; // e.g., "Rooftop Bar", "Fitness Center"
  description: string;
  imageUrls: string[];
  phone: string;
  sentiment: string[]; // e.g., "Times Square", "Midtown", "Broadway"
  bookingUrl?: string; // Optional booking URL for the hotel
  badge?: { icon: string; text: string }; // Optional badge shown next to star rating
  pointsCash?: { points: number; cash: number }; // Points + cash pricing option
  matchScore?: number; // 0–99 relevance score for the current search (undefined = don't show)
  matchContext?: {    // criteria used to generate the score (travels with the hotel)
    amenities: string[];
    brands: string[];
    priceRange: { min?: number; max?: number } | null;
    minRating: number | null;
    sentiments: string[]; // only non-generic ones
  };
  matchReason?: string;        // warm 1-line sentence e.g. "Great for your family stay near Times Square"
  matchType?: 'best' | 'near'; // 'best' = score >= 90, 'near' = 75–89
  matchChips?: string[];       // top 2-3 matched amenity labels for card teaser
  matchedItems?: string[];     // all matched criteria labels for drawer (✓ items)
  missingItems?: string[];     // unmatched criteria labels for drawer (✗ items)
  bedType: string;                                    // e.g. "1 King", "2 Queen"
  verifiedAmenities: { id: string; label: string }[]; // ONLY claimable amenity set
  missingAmenities: { id: string; label: string }[];  // honest ✗
  neighborhood: {
    name: string;
    vibe: string[];
    walkScore: number;
    nearby: string[];
  };
  pointsEarned: number;
  walkToDiningMin: number;
}
