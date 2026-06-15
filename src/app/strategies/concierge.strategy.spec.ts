import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConciergeStrategy } from './concierge.strategy';
import { ClaimService } from '../services/claim.service';
import { MatchService } from '../services/match.service';
import { PricingService } from '../services/pricing.service';
import { AIService } from '../services/ai.service';
import { Hotel } from '../models/hotel.model';
import { TurnPlan } from '../models/search-strategy.model';

function hotel(verified: {id:string;label:string}[], miss: {id:string;label:string}[] = []): Hotel {
  return {
    id: 'x', name: 'voco H', brand: 'voco', rating: 4,
    location: { address: '', neighborhood: 'Theater District', coordinates: { lat: 0, lng: 0 } },
    pricing: { nightlyRate: 300, roomRate: 300, fees: 60, allInNightly: 360 },
    amenities: [], bedType: '1 King',
    verifiedAmenities: verified, missingAmenities: miss,
    neighborhood: { name: 'Theater District', vibe: ['lively'], walkScore: 98, nearby: [] },
    pointsEarned: 0, walkToDiningMin: 2,
    description: '', imageUrls: [], phone: '', sentiment: [],
  };
}

describe('ConciergeStrategy.buildView', () => {
  let strat: ConciergeStrategy;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConciergeStrategy, ClaimService, MatchService, PricingService, AIService],
    });
    strat = TestBed.inject(ConciergeStrategy);
  });

  it('builds result VMs with all-in primary, bed type, reason, verified/misses', () => {
    const plan: TurnPlan = { intent: 'complete_query', criteria: { amenities: ['rooftop_bar'] }, needsClarification: false, shouldSearch: true };
    const hotels = [hotel([{id:'rooftop_bar',label:'Rooftop Bar'}], [{id:'pool',label:'Pool'}])];
    const view = strat.buildView('rooftop bar', plan, hotels);
    const vm = view.results[0];
    expect(vm.allInPrimary).toBe('$360');
    expect(vm.finePrint).toContain('room');
    expect(vm.bedType).toBe('1 King');
    expect(vm.reason).toContain('Rooftop Bar');
    expect(vm.verified.map(v => v.id)).toContain('rooftop_bar');
  });

  it('emits refinement chips with live counts and never a zero-count chip', () => {
    const plan: TurnPlan = { intent: 'complete_query', criteria: {}, needsClarification: false, shouldSearch: true };
    const hotels = [hotel([{id:'rooftop_bar',label:'Rooftop Bar'}]), hotel([])];
    const view = strat.buildView('hotels', plan, hotels);
    expect(view.refinementChips.every(c => !c.count.startsWith('0 '))).toBe(true);
  });

  it('only surfaces a clarifier when the dimension splits inventory', () => {
    // rooftop_bar present in ONE of two hotels → varies → clarifier shown
    const planVaries: TurnPlan = { intent: 'complete_query', criteria: {}, needsClarification: true, clarifier: { dimension: 'rooftop_bar', kind: 'must_vs_nice' }, shouldSearch: true };
    const hotels = [hotel([{id:'rooftop_bar',label:'Rooftop Bar'}]), hotel([])];
    expect(strat.buildView('q', planVaries, hotels).clarifier).toBeTruthy();

    // rooftop_bar present in ALL hotels → does NOT vary → clarifier suppressed
    const allHave = [hotel([{id:'rooftop_bar',label:'Rooftop Bar'}]), hotel([{id:'rooftop_bar',label:'Rooftop Bar'}])];
    expect(strat.buildView('q', planVaries, allHave).clarifier).toBeUndefined();
  });
});
