import { TestBed } from '@angular/core/testing';
import { MatchService, RefinementCandidate } from './match.service';
import { ClaimService } from './claim.service';
import { Hotel } from '../models/hotel.model';

function hotel(verified: {id:string;label:string}[]): Hotel {
  return {
    id: 'x', name: 'H', brand: 'voco', rating: 4,
    location: { address: '', neighborhood: 'Theater District', coordinates: { lat: 0, lng: 0 } },
    pricing: { nightlyRate: 300, roomRate: 300, fees: 60, allInNightly: 360 },
    amenities: [], bedType: '1 King',
    verifiedAmenities: verified, missingAmenities: [],
    neighborhood: { name: 'Theater District', vibe: ['lively'], walkScore: 98, nearby: [] },
    pointsEarned: 0, walkToDiningMin: 2,
    description: '', imageUrls: [], phone: '', sentiment: [],
  };
}

describe('MatchService.score', () => {
  let svc: MatchService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MatchService, ClaimService] });
    svc = TestBed.inject(MatchService);
  });

  it('scores a full amenity match higher than a partial one', () => {
    const full = svc.score(hotel([{id:'rooftop_bar',label:'Rooftop Bar'}]), { amenities: ['rooftop_bar'] });
    const none = svc.score(hotel([]), { amenities: ['rooftop_bar'] });
    expect(full.score).toBeGreaterThan(none.score);
    expect(full.reasons.length).toBeGreaterThan(0);
    expect(none.misses.map(m => m.id)).toContain('rooftop_bar');
  });

  it('maps label-form criteria to canonical ids when scoring', () => {
    // "Rooftop Bar" (label) must match verified id rooftop_bar via ClaimService.toId
    const r = svc.score(hotel([{id:'rooftop_bar',label:'Rooftop Bar'}]), { amenities: ['Rooftop Bar'] });
    expect(r.reasons.map(x => x.id)).toContain('rooftop_bar');
  });
});

describe('MatchService.inventoryCounts', () => {
  let svc: MatchService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MatchService, ClaimService] });
    svc = TestBed.inject(MatchService);
  });

  it('returns live counts and drops zero-result candidates', () => {
    const hotels = [
      hotel([{ id: 'rooftop_bar', label: 'Rooftop Bar' }]),
      hotel([]),
    ];
    const candidates: RefinementCandidate[] = [
      { label: 'Rooftop bar', criterion: { kind: 'amenity', value: 'rooftop_bar' } },
      { label: 'Pool',        criterion: { kind: 'amenity', value: 'pool' } }, // 0 hotels → dropped
    ];
    const chips = svc.inventoryCounts(hotels, candidates);
    expect(chips.find(c => c.label === 'Rooftop bar')?.count).toBe('1 of 2');
    expect(chips.find(c => c.label === 'Pool')).toBeUndefined();
  });

  it('counts vibe and neighborhood criteria too', () => {
    const h = hotel([]);
    const chips = svc.inventoryCounts([h], [
      { label: 'Lively', criterion: { kind: 'vibe', value: 'lively' } },
      { label: 'Theater District', criterion: { kind: 'neighborhood', value: 'Theater District' } },
      { label: 'Quiet', criterion: { kind: 'vibe', value: 'quiet' } }, // 0 → dropped
    ]);
    expect(chips.find(c => c.label === 'Lively')?.count).toBe('1 of 1');
    expect(chips.find(c => c.label === 'Theater District')?.count).toBe('1 of 1');
    expect(chips.find(c => c.label === 'Quiet')).toBeUndefined();
  });
});
