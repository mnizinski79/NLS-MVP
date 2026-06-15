import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ISearchStrategy } from './search-strategy.interface';
import { Hotel } from '../models/hotel.model';
import { ConversationState } from '../models/conversation-state.model';
import { TurnPlan, TurnView, HotelResultVM } from '../models/search-strategy.model';
import { AIService } from '../services/ai.service';
import { ClaimService } from '../services/claim.service';
import { MatchService, RefinementCandidate } from '../services/match.service';
import { PricingService } from '../services/pricing.service';

@Injectable({ providedIn: 'root' })
export class ConciergeStrategy implements ISearchStrategy {
  constructor(
    private ai: AIService,
    private claims: ClaimService,
    private match: MatchService,
    private pricing: PricingService,
  ) {}

  planTurn(query: string, state: ConversationState): Observable<TurnPlan> {
    return this.ai.planTurn(query, state);
  }

  buildView(query: string, plan: TurnPlan, hotels: Hotel[]): TurnView {
    const results: HotelResultVM[] = hotels.map(h => {
      const m = this.match.score(h, plan.criteria);
      return {
        hotel: h,
        allInPrimary: this.pricing.formatAllIn(h),
        finePrint: this.pricing.formatFinePrint(h),
        bedType: h.bedType,
        reason: this.claims.whyThisHotel(h, plan.criteria),
        verified: m.reasons,
        misses: m.misses,
        score: m.score,
      };
    });

    const refinementChips = this.match
      .inventoryCounts(hotels, this.candidateRefinements(hotels))
      .slice(0, 4);

    return {
      clarifier: this.buildClarifier(plan, hotels),
      intro: results.length
        ? `Here are ${results.length} stays I can stand behind:`
        : `I couldn't find a match for that — try broadening your search.`,
      results,
      refinementChips,
    };
  }

  /** Build candidate refinements from amenities/vibes actually present in the set. */
  private candidateRefinements(hotels: Hotel[]): RefinementCandidate[] {
    const seen = new Map<string, RefinementCandidate>();
    for (const h of hotels) {
      for (const a of h.verifiedAmenities ?? []) {
        if (!seen.has('a:' + a.id)) seen.set('a:' + a.id, { label: a.label, criterion: { kind: 'amenity', value: a.id } });
      }
      for (const v of h.neighborhood?.vibe ?? []) {
        const key = 'v:' + v.toLowerCase();
        if (!seen.has(key)) seen.set(key, { label: this.cap(v), criterion: { kind: 'vibe', value: v } });
      }
    }
    return Array.from(seen.values());
  }

  /** Grounding guard: only surface the clarifier if the dimension splits inventory. */
  private buildClarifier(plan: TurnPlan, hotels: Hotel[]): TurnView['clarifier'] | undefined {
    if (!plan.needsClarification || !plan.clarifier) return undefined;
    const dim = plan.clarifier.dimension;
    const withDim = hotels.filter(h => (h.verifiedAmenities ?? []).some(a => a.id === dim)).length;
    const varies = withDim > 0 && withDim < hotels.length;
    if (!varies) return undefined;
    const label = (hotels.flatMap(h => h.verifiedAmenities).find(a => a.id === dim)?.label) || this.cap(dim);
    return {
      text: `Is a ${label.toLowerCase()} a must-have, or just nice to have?`,
      chips: [
        { label: 'Must-have', value: `must:${dim}` },
        { label: 'Nice-to-have', value: `nice:${dim}` },
      ],
    };
  }

  private cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
}
