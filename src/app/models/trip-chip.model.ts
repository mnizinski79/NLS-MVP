export type TripChipType = 'sentiment' | 'price' | 'brand' | 'amenity' | 'rating' | 'guests';

export interface TripChip {
  /** Stable unique key (e.g. "sentiment-Brooklyn", "price", "brand-Kimpton") */
  id: string;
  /** Human-readable label shown in the chip */
  label: string;
  /** Category — used to know which field to clear on removal */
  type: TripChipType;
  /** Raw value (e.g. the string "Brooklyn" or number 4.0) */
  value: any;
}
