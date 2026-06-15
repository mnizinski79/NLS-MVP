import { TestBed } from '@angular/core/testing';
import { ClaimService } from './claim.service';
import { Hotel } from '../models/hotel.model';

function hotel(over: Partial<Hotel> = {}): Hotel {
  return {
    id: '1', name: 'voco Test', brand: 'voco', rating: 4,
    location: { address: '', neighborhood: 'Theater District', coordinates: { lat: 0, lng: 0 } },
    pricing: { nightlyRate: 300, roomRate: 300, fees: 60, allInNightly: 360 },
    amenities: ['Rooftop Bar'], bedType: '1 King',
    verifiedAmenities: [{ id: 'rooftop_bar', label: 'Rooftop Bar' }, { id: 'free_wi_fi', label: 'Free Wi-Fi' }],
    missingAmenities: [{ id: 'pool', label: 'Pool' }],
    neighborhood: { name: 'Theater District', vibe: ['lively', 'walkable'], walkScore: 98, nearby: ['Times Square 2 min'] },
    pointsEarned: 9000, walkToDiningMin: 2,
    description: '', imageUrls: [], phone: '', sentiment: [],
    ...over,
  };
}

describe('ClaimService', () => {
  let svc: ClaimService;
  beforeEach(() => { TestBed.configureTestingModule({}); svc = TestBed.inject(ClaimService); });

  it('claimAmenities splits requested into has/missing using ONLY verified data', () => {
    const r = svc.claimAmenities(hotel(), ['rooftop_bar', 'pool']);
    expect(r.has.map(a => a.id)).toEqual(['rooftop_bar']);
    expect(r.missing.map(a => a.id)).toEqual(['pool']);
  });

  it('never claims an amenity absent from verifiedAmenities (property-style)', () => {
    const h = hotel();
    const verifiedIds = new Set(h.verifiedAmenities.map(a => a.id));
    const candidates = ['rooftop_bar', 'pool', 'spa', 'free_wi_fi', 'restaurant', 'pet_friendly'];
    for (let i = 0; i < 50; i++) {
      const requested = candidates.filter(() => Math.random() < 0.5);
      const r = svc.claimAmenities(h, requested);
      for (const claimed of r.has) {
        expect(verifiedIds.has(claimed.id)).toBe(true);
      }
    }
  });

  it('whyThisHotel only references verified facts and bed type', () => {
    const s = svc.whyThisHotel(hotel(), { amenities: ['rooftop_bar'] } as any);
    expect(s).toContain('Rooftop Bar');
    expect(s).not.toContain('Pool');
  });

  it('toId maps a hyphenated label to the canonical id (matches data)', () => {
    // whyThisHotel requests by label "Free Wi-Fi" and must hit the verified id free_wi_fi
    const s = svc.whyThisHotel(hotel(), { amenities: ['Free Wi-Fi'] } as any);
    expect(s).toContain('Free Wi-Fi');
  });
});
