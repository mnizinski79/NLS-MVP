export interface Room {
  id: string;
  hotelId: string;
  name: string;        // e.g. "2 Queen", "King Suite"
  beds: number;        // number of beds
  capacity: number;    // max guests
  imageUrl: string;
  amenities: string[]; // all room amenities
  nightlyRate: number;
}
