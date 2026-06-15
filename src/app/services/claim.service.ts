import { Injectable } from '@angular/core';
import { Hotel } from '../models/hotel.model';
import { SearchCriteria } from '../models/search-criteria.model';

export interface AmenityRef { id: string; label: string; }

@Injectable({ providedIn: 'root' })
export class ClaimService {
  /**
   * Split requested amenity ids into those the hotel verifiably has and those it
   * does not. Reads ONLY verifiedAmenities — the single claim source.
   */
  claimAmenities(hotel: Hotel, requestedIds: string[]): { has: AmenityRef[]; missing: AmenityRef[] } {
    const verified = hotel.verifiedAmenities ?? [];
    const verifiedById = new Map(verified.map(a => [a.id, a]));
    const has: AmenityRef[] = [];
    const missing: AmenityRef[] = [];
    for (const id of requestedIds) {
      const hit = verifiedById.get(id);
      if (hit) {
        has.push(hit);
      } else {
        const known = (hotel.missingAmenities ?? []).find(a => a.id === id);
        missing.push(known ?? { id, label: this.humanize(id) });
      }
    }
    return { has, missing };
  }

  /** Compose a "why this hotel" sentence from verified facts only. Never names a miss. */
  whyThisHotel(hotel: Hotel, criteria: SearchCriteria | null | undefined): string {
    const reasons: string[] = [];
    const requested = (criteria?.amenities ?? []).map(a => this.toId(a));
    const { has } = this.claimAmenities(hotel, requested);
    if (has.length) {
      reasons.push(`has ${this.list(has.map(a => a.label))}`);
    }
    if (hotel.bedType) {
      reasons.push(`offers a ${hotel.bedType} room`);
    }
    if (hotel.neighborhood?.vibe?.length) {
      reasons.push(`sits in ${hotel.neighborhood.name} (${hotel.neighborhood.vibe.join(', ')})`);
    }
    if (!reasons.length) {
      return `A solid match in ${hotel.neighborhood?.name || 'the area'}.`;
    }
    return `This one ${reasons.join('; ')}.`;
  }

  private list(labels: string[]): string {
    if (labels.length <= 1) return labels[0] ?? '';
    return labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1];
  }

  /** CANONICAL amenity id derivation — must match hotels.json data exactly. */
  toId(label: string): string {
    return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  private humanize(id: string): string {
    return id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
}
