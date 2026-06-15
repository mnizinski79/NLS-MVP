import { Observable } from 'rxjs';
import { Hotel } from '../models/hotel.model';
import { ConversationState } from '../models/conversation-state.model';
import { TurnPlan, TurnView } from '../models/search-strategy.model';

export interface ISearchStrategy {
  /** Ask the planner what to do this turn. */
  planTurn(query: string, state: ConversationState): Observable<TurnPlan>;
  /** Build the view-model the components render. */
  buildView(query: string, plan: TurnPlan, hotels: Hotel[]): TurnView;
}
