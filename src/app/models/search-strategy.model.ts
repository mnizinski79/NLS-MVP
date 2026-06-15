export enum SearchStrategy {
  RECEIPTS = 'RECEIPTS',
  ALL_IN = 'ALL_IN',
  COMPARE = 'COMPARE',
  SCORECARD = 'SCORECARD',
  CONCIERGE = 'CONCIERGE',
  TRIP_CANVAS = 'TRIP_CANVAS',
}

import { IntentType } from './conversation-state.model';
import { SearchCriteria } from './search-criteria.model';

export interface TurnPlan {
  intent: IntentType;
  criteria: SearchCriteria;
  needsClarification: boolean;
  clarifier?: { dimension: string; kind: 'must_vs_nice' | 'pick_one' | 'confirm' };
  shouldSearch: boolean;
}
