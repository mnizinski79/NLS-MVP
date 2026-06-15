import { IntentType } from './conversation-state.model';
import { SearchCriteria } from './search-criteria.model';
import { Hotel } from './hotel.model';
import { RefinementChipVM } from '../services/match.service';

export enum SearchStrategy {
  RECEIPTS = 'RECEIPTS',
  ALL_IN = 'ALL_IN',
  COMPARE = 'COMPARE',
  SCORECARD = 'SCORECARD',
  CONCIERGE = 'CONCIERGE',
  TRIP_CANVAS = 'TRIP_CANVAS',
}

export interface TurnPlan {
  intent: IntentType;
  criteria: SearchCriteria;
  needsClarification: boolean;
  clarifier?: { dimension: string; kind: 'must_vs_nice' | 'pick_one' | 'confirm' };
  shouldSearch: boolean;
}

export interface QuickReply { label: string; value: string; }

export interface HotelResultVM {
  hotel: Hotel;
  allInPrimary: string;     // big number, e.g. "$360"
  finePrint: string;        // "$300 room + $60 taxes & fees"
  bedType: string;
  reason: string;           // why-this-hotel (ClaimService)
  verified: { id: string; label: string }[];
  misses: { id: string; label: string }[];
  score?: number;
}

export interface TurnView {
  clarifier?: { text: string; chips: QuickReply[] };
  intro: string;
  results: HotelResultVM[];
  refinementChips: RefinementChipVM[];
}
