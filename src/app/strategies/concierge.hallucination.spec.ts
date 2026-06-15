import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConciergeStrategy } from './concierge.strategy';
import { ClaimService } from '../services/claim.service';
import { MatchService } from '../services/match.service';
import { PricingService } from '../services/pricing.service';
import { AIService } from '../services/ai.service';
import { Hotel } from '../models/hotel.model';
import { TurnPlan } from '../models/search-strategy.model';

function hotel(): Hotel {
  return {
    id: 'x', name: 'voco H', brand: 'voco', rating: 4,
    location: { address: '', neighborhood: 'Theater District', coordinates: { lat: 0, lng: 0 } },
    pricing: { nightlyRate: 300, roomRate: 300, fees: 60, allInNightly: 360 },
    amenities: [], bedType: '1 King',
    verifiedAmenities: [{ id: 'free_wi_fi', label: 'Free Wi-Fi' }],
    missingAmenities: [{ id: 'pool', label: 'Pool' }],
    neighborhood: { name: 'Theater District', vibe: ['lively'], walkScore: 98, nearby: [] },
    pointsEarned: 0, walkToDiningMin: 2,
    description: '', imageUrls: [], phone: '', sentiment: [],
  };
}

describe('CONCIERGE hallucination guarantee', () => {
  let strat: ConciergeStrategy;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConciergeStrategy, ClaimService, MatchService, PricingService, AIService],
    });
    strat = TestBed.inject(ConciergeStrategy);
  });

  it('a plan requesting unverified amenities never renders them as verified facts', () => {
    // The "model" hallucinated a rooftop bar + pool the hotel does NOT verify.
    const plan: TurnPlan = { intent: 'complete_query', criteria: { amenities: ['rooftop_bar', 'pool'] }, needsClarification: false, shouldSearch: true };
    const view = strat.buildView('rooftop and pool', plan, [hotel()]);
    const vm = view.results[0];
    // verified list contains ONLY truly-verified amenities (neither requested one is verified)
    expect(vm.verified.map(v => v.id)).toEqual([]);
    expect(vm.misses.map(m => m.id).sort()).toEqual(['pool', 'rooftop_bar']);
    // the reason text never names a missing amenity
    expect(vm.reason.toLowerCase()).not.toContain('pool');
    expect(vm.reason.toLowerCase()).not.toContain('rooftop');
  });

  it('only the genuinely verified amenity can appear in verified, even when extra are requested', () => {
    const plan: TurnPlan = { intent: 'complete_query', criteria: { amenities: ['free_wi_fi', 'spa', 'pool'] }, needsClarification: false, shouldSearch: true };
    const vm = strat.buildView('wifi spa pool', plan, [hotel()]).results[0];
    expect(vm.verified.map(v => v.id)).toEqual(['free_wi_fi']);
    expect(vm.misses.map(m => m.id).sort()).toEqual(['pool', 'spa']);
  });
});
