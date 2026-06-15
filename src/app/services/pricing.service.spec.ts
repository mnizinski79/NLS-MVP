import { TestBed } from '@angular/core/testing';
import { PricingService } from './pricing.service';
import { Hotel } from '../models/hotel.model';

function hotel(): Hotel {
  return {
    id: '1', name: 'H', brand: 'voco', rating: 4,
    location: { address: '', neighborhood: '', coordinates: { lat: 0, lng: 0 } },
    pricing: { nightlyRate: 300, roomRate: 300, fees: 60, allInNightly: 360 },
    amenities: [], bedType: '1 King',
    verifiedAmenities: [], missingAmenities: [],
    neighborhood: { name: '', vibe: [], walkScore: 0, nearby: [] },
    pointsEarned: 0, walkToDiningMin: 0,
    description: '', imageUrls: [], phone: '', sentiment: [],
  };
}

describe('PricingService all-in', () => {
  let svc: PricingService;
  beforeEach(() => { TestBed.configureTestingModule({}); svc = TestBed.inject(PricingService); });

  it('allInNightly returns roomRate + fees', () => {
    expect(svc.allInNightly(hotel())).toBe(360);
  });

  it('allInTotal multiplies by nights', () => {
    expect(svc.allInTotal(hotel(), 3)).toBe(1080);
  });

  it('formatAllIn (cash) leads with the all-in number, not the base rate', () => {
    svc.setMode('cash');
    const s = svc.formatAllIn(hotel());
    expect(s).toContain('360');
    expect(s).not.toContain('300');
  });

  it('formatFinePrint shows room + taxes & fees', () => {
    expect(svc.formatFinePrint(hotel())).toBe('$300 room + $60 taxes & fees');
  });
});
