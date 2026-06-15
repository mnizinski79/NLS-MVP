import { Injectable } from '@angular/core';
import { Hotel } from '../models/hotel.model';
import { SearchCriteria } from '../models/search-criteria.model';
import { ClaimService, AmenityRef } from './claim.service';

export interface MatchResult {
  score: number;              // 0–99
  reasons: AmenityRef[];      // verified hits that matched the request
  misses: AmenityRef[];       // honest ✗
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  constructor(private claims: ClaimService) {}

  score(hotel: Hotel, criteria: SearchCriteria | null | undefined): MatchResult {
    // Reuse the canonical id rule from ClaimService so labels map to data ids.
    const requested = (criteria?.amenities ?? []).map(a => this.claims.toId(a));
    const { has, missing } = this.claims.claimAmenities(hotel, requested);

    let pct: number;
    if (requested.length > 0) {
      pct = has.length / requested.length;            // amenity coverage
    } else {
      pct = Math.max(0, Math.min(1, (hotel.rating - 3) / 2)); // quality proxy
    }
    const score = Math.min(Math.round(75 + pct * 24), 99);
    return { score, reasons: has, misses: missing };
  }
}
