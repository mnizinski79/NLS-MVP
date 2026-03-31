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
  };
  amenities: string[]; // e.g., "Rooftop Bar", "Fitness Center"
  description: string;
  imageUrls: string[];
  phone: string;
  sentiment: string[]; // e.g., "Times Square", "Midtown", "Broadway"
  bookingUrl?: string; // Optional booking URL for the hotel
  badge?: { icon: string; text: string }; // Optional badge shown next to star rating
  pointsCash?: { points: number; cash: number }; // Points + cash pricing option
}
