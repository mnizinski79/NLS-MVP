import { TestBed } from '@angular/core/testing';
import { MatchService } from './match.service';
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
