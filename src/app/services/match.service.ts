import { Injectable } from '@angular/core';
import { Hotel } from '../models/hotel.model';
import { SearchCriteria } from '../models/search-criteria.model';
import { ClaimService, AmenityRef } from './claim.service';

export interface MatchResult {
  score: number;              // 0–99
  reasons: AmenityRef[];      // verified hits that matched the request
  misses: AmenityRef[];       // honest ✗
}

export interface Criterion { kind: 'amenity' | 'neighborhood' | 'vibe'; value: string; }
export interface RefinementCandidate { label: string; criterion: Criterion; }
export interface RefinementChipVM { label: string; count: string; criterion: Criterion; }

@Injectable({ providedIn: 'root' })
export class MatchService {
  /** Shown scores sit in a deliberately compressed 75–99 band so every result reads as a credible match. */
  private readonly BASE_SCORE = 75;
  private readonly SCORE_SPAN = 24;

  constructor(private claims: ClaimService) {}

  /** Count how many hotels satisfy each candidate; drop zero-result candidates. */
  inventoryCounts(hotels: Hotel[], candidates: RefinementCandidate[]): RefinementChipVM[] {
    const total = hotels.length;
    const chips: RefinementChipVM[] = [];
    for (const c of candidates) {
      const n = hotels.filter(h => this.meetsCriterion(h, c.criterion)).length;
      if (n > 0) {
        chips.push({ label: c.label, count: `${n} of ${total}`, criterion: c.criterion });
      }
    }
    return chips;
  }

  private meetsCriterion(hotel: Hotel, criterion: Criterion): boolean {
    switch (criterion.kind) {
      case 'amenity':
        return (hotel.verifiedAmenities ?? []).some(a => a.id === criterion.value);
      case 'neighborhood':
        return hotel.neighborhood?.name?.toLowerCase() === criterion.value.toLowerCase();
      case 'vibe':
        return (hotel.neighborhood?.vibe ?? []).map(v => v.toLowerCase()).includes(criterion.value.toLowerCase());
    }
  }

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
    const score = Math.min(Math.round(this.BASE_SCORE + pct * this.SCORE_SPAN), 99);
    return { score, reasons: has, misses: missing };
  }
}
