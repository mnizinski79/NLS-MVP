import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Hotel, SearchCriteria } from '../models';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private hotelsCache: Hotel[] | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Load hotels from JSON file with caching
   * Implements error handling for data loading failures
   * @returns Observable of Hotel array
   * @throws Error if hotel data cannot be loaded
   */
  loadHotels(): Observable<Hotel[]> {
    if (this.hotelsCache) {
      return of(this.hotelsCache);
    }

    return this.http.get<any[]>('assets/hotels.json').pipe(
      map(rawHotels => {
        // Transform raw data to Hotel interface
        const hotels = rawHotels.map(raw => this.transformRawHotel(raw));
        this.hotelsCache = hotels;
        return hotels;
      }),
      catchError(error => {
        console.error('Failed to load hotels:', error);
        return throwError(() => new Error('Failed to load hotel data. Please try again later.'));
      })
    );
  }

  /**
   * Transform raw JSON data to Hotel interface
   * Maps brand IDs and restructures pricing/location data
   * @param raw - Raw hotel data from JSON
   * @returns Transformed Hotel object
   */
  private transformRawHotel(raw: any): Hotel {
    return {
      id: raw.id,
      name: raw.name,
      brand: raw.brand || 'Independent', // Use existing brand field
      rating: raw.rating,
      location: {
        address: raw.location.address,
        neighborhood: raw.location.neighborhood || raw.sentiment?.[0] || '',
        coordinates: {
          lat: raw.location.coordinates?.lat || raw.location.lat,
          lng: raw.location.coordinates?.lng || raw.location.lng
        }
      },
      pricing: {
        nightlyRate: raw.pricing?.nightlyRate || raw.price?.nightlyRate || 0,
        roomRate: raw.pricing?.roomRate || raw.price?.amount || 0,
        fees: raw.pricing?.fees || (raw.price?.amount - raw.price?.nightlyRate) || 0
      },
      amenities: raw.amenities || [],
      description: raw.description || '',
      imageUrls: raw.imageUrls || [],
      phone: raw.phoneNumber || raw.phone || '',
      sentiment: raw.sentiment || [],
      bookingUrl: raw.bookingUrl,
      badge: raw.badge,
      pointsCash: raw.pointsCash
    };
  }

  /**
   * Map brand ID from JSON to standardized brand name
   * @param brandId - Raw brand identifier from JSON data
   * @returns Standardized brand name
   */
  private mapBrandId(brandId: string): Hotel['brand'] {
    const brandMap: Record<string, Hotel['brand']> = {
      'kimpton': 'Kimpton',
      'voco': 'voco',
      'intercontinental': 'InterContinental',
      'holidayinn': 'Holiday Inn',
      'independent': 'Independent'
    };
    return brandMap[brandId.toLowerCase()] || 'Independent';
  }

  /**
   * Filter hotels by brand names
   * @param hotels - Array of hotels to filter
   * @param brands - Array of brand names to match
   * @returns Filtered array of hotels matching any of the specified brands
   */
  filterByBrand(hotels: Hotel[], brands: string[]): Hotel[] {
    if (!brands || brands.length === 0) {
      return hotels;
    }
    return hotels.filter(h => brands.includes(h.brand));
  }

  /**
   * Filter hotels by sentiment/location with OR logic
   * A hotel matches if it has ANY of the specified sentiments
   * @param hotels - Array of hotels to filter
   * @param sentiments - Array of sentiment/location keywords to match
   * @returns Filtered array of hotels matching any sentiment
   */
  filterBySentiment(hotels: Hotel[], sentiments: string[]): Hotel[] {
    if (!sentiments || sentiments.length === 0) {
      return hotels;
    }
    
    console.log('🔍 SENTIMENT FILTER DEBUG:', {
      searchingFor: sentiments,
      hotelCount: hotels.length,
      allHotelSentiments: hotels.map(h => ({ name: h.name, sentiments: h.sentiment }))
    });
    
    const filtered = hotels.filter(h =>
      h.sentiment.some(s => sentiments.includes(s))
    );
    
    console.log('🔍 SENTIMENT FILTER RESULT:', {
      inputCount: hotels.length,
      outputCount: filtered.length,
      filteredHotels: filtered.map(h => ({ name: h.name, sentiments: h.sentiment }))
    });
    
    return filtered;
  }

  /**
   * Filter hotels by amenities with OR logic
   * A hotel matches if it has ANY of the specified amenities
   * @param hotels - Array of hotels to filter
   * @param amenities - Array of amenity names to match
   * @returns Filtered array of hotels having any of the specified amenities
   */
  filterByAmenities(hotels: Hotel[], amenities: string[]): Hotel[] {
    if (!amenities || amenities.length === 0) {
      return hotels;
    }
    
    console.log('🔍 AMENITY FILTER DEBUG:', {
      searchingFor: amenities,
      hotelCount: hotels.length,
      sampleHotelAmenities: hotels[0]?.amenities || []
    });
    
    const filtered = hotels.filter(h => {
      const hasAmenity = amenities.some(a => h.amenities.includes(a));
      if (hasAmenity) {
        console.log('✅ Hotel matched:', h.name, 'has amenities:', h.amenities);
      }
      return hasAmenity;
    });
    
    console.log('🔍 AMENITY FILTER RESULT:', {
      inputCount: hotels.length,
      outputCount: filtered.length,
      filteredHotels: filtered.map(h => ({ name: h.name, amenities: h.amenities }))
    });
    
    return filtered;
  }

  /**
   * Filter hotels by price range
   * @param hotels - Array of hotels to filter
   * @param min - Minimum nightly rate (optional)
   * @param max - Maximum nightly rate (optional)
   * @returns Filtered array of hotels within the price range
   */
  filterByPrice(hotels: Hotel[], min?: number, max?: number): Hotel[] {
    return hotels.filter(h => {
      const price = h.pricing.nightlyRate;
      if (min !== undefined && price < min) return false;
      if (max !== undefined && price > max) return false;
      return true;
    });
  }

  /**
   * Filter hotels by minimum star rating
   * @param hotels - Array of hotels to filter
   * @param minRating - Minimum star rating (1-5)
   * @returns Filtered array of hotels with rating >= minRating
   */
  filterByRating(hotels: Hotel[], minRating: number): Hotel[] {
    if (minRating === undefined) {
      return hotels;
    }
    return hotels.filter(h => h.rating >= minRating);
  }

  /**
   * Sort hotels by specified criteria
   * @param hotels - Array of hotels to sort
   * @param sortBy - Sort criteria: 'price_asc', 'price_desc', or 'rating_desc'
   * @returns Sorted array of hotels (new array, does not mutate input)
   */
  sortHotels(hotels: Hotel[], sortBy: 'price_asc' | 'price_desc' | 'rating_desc'): Hotel[] {
    const sorted = [...hotels];

    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) =>
          a.pricing.nightlyRate - b.pricing.nightlyRate
        );
      case 'price_desc':
        return sorted.sort((a, b) =>
          b.pricing.nightlyRate - a.pricing.nightlyRate
        );
      case 'rating_desc':
        return sorted.sort((a, b) => b.rating - a.rating);
      default:
        return sorted;
    }
  }

  /**
   * Main filter pipeline - applies all filters in sequence
   * Filter order: brand → sentiment → price → amenities → rating → sort
   * If price filter returns 0 results, expands budget and sorts by price
   * If location specified but filters return 0 results, shows top 3 by relevance
   * @param hotels - Array of hotels to filter
   * @param criteria - Search criteria object with optional filter parameters
   * @returns Filtered and sorted array of hotels
   */
  filterHotels(hotels: Hotel[], criteria: SearchCriteria): Hotel[] {
    let filtered = hotels;
    
    // Track if location/sentiment filter was applied
    const hasLocationFilter = !!(criteria.sentiments?.length);
    
    // Track if ANY other filter was applied (amenities, price, rating, brand)
    const hasOtherFilters = !!(
      criteria.brands?.length ||
      criteria.amenities?.length ||
      criteria.priceRange ||
      criteria.minRating !== undefined
    );
    
    // If user has other filters but no specific location sentiment, treat as implicit NYC location
    // This handles cases like "hotels in NYC with restaurant" where NYC isn't a specific sentiment
    const hasImplicitLocation = hasOtherFilters && !hasLocationFilter;

    console.log('💰 PRICE FILTER DEBUG - Starting:', {
      totalHotels: hotels.length,
      priceRange: criteria.priceRange,
      hasLocationFilter,
      hasOtherFilters,
      hasImplicitLocation,
      hotelPrices: hotels.map(h => ({ name: h.name, price: h.pricing.nightlyRate }))
    });

    // 1. Brand filter
    if (criteria.brands?.length) {
      filtered = this.filterByBrand(filtered, criteria.brands);
      console.log('💰 After brand filter:', filtered.length, 'hotels');
    }

    // 2. Sentiment filter (location/neighborhood)
    if (criteria.sentiments?.length) {
      filtered = this.filterBySentiment(filtered, criteria.sentiments);
      console.log('💰 After sentiment filter:', filtered.length, 'hotels');
    }

    // 3. Price range filter with fallback
    if (criteria.priceRange) {
      const beforePriceFilter = filtered.length;
      const priceFiltered = this.filterByPrice(
        filtered,
        criteria.priceRange.min,
        criteria.priceRange.max
      );
      
      console.log('💰 PRICE FILTER RESULT:', {
        beforeFilter: beforePriceFilter,
        afterFilter: priceFiltered.length,
        priceRange: criteria.priceRange,
        filteredHotels: priceFiltered.map(h => ({ name: h.name, price: h.pricing.nightlyRate }))
      });
      
      // If price filter returns 0 results, remove price filter and sort by price
      if (priceFiltered.length === 0 && filtered.length > 0) {
        console.log('⚠️ Price filter returned 0 results, expanding budget and showing cheapest options');
        console.log('💰 Available hotels before price filter:', filtered.map(h => ({ name: h.name, price: h.pricing.nightlyRate })));
        // Don't apply price filter, keep the filtered list and sort by price ascending
        criteria.sortBy = 'price_asc';
      } else {
        filtered = priceFiltered;
      }
    }

    // 4. Amenities filter (OR logic)
    if (criteria.amenities?.length) {
      filtered = this.filterByAmenities(filtered, criteria.amenities);
      console.log('💰 After amenities filter:', filtered.length, 'hotels');
    }

    // 5. Rating filter
    if (criteria.minRating !== undefined) {
      filtered = this.filterByRating(filtered, criteria.minRating);
      console.log('💰 After rating filter:', filtered.length, 'hotels');
    }

    // 6. Fallback: If location was specified (explicit or implicit) but no results, show top 3 by rating
    // This ensures users get results when they specify a location but filters are too restrictive
    if (filtered.length === 0 && (hasLocationFilter || hasImplicitLocation)) {
      console.log('⚠️ No results found with filters, but location was specified. Showing top 3 hotels by rating.');
      // Get all hotels, sort by rating, take top 3
      filtered = this.sortHotels(hotels, 'rating_desc').slice(0, 3);
      console.log('💰 Fallback results:', filtered.map(h => ({ name: h.name, rating: h.rating })));
    }

    // 7. Sort
    if (criteria.sortBy) {
      filtered = this.sortHotels(filtered, criteria.sortBy);
      console.log('💰 After sorting by', criteria.sortBy, ':', filtered.map(h => ({ name: h.name, price: h.pricing.nightlyRate })));
    }

    console.log('💰 FINAL RESULT:', {
      count: filtered.length,
      hotels: filtered.map(h => ({ name: h.name, price: h.pricing.nightlyRate }))
    });

    return filtered;
  }

  /**
   * Get a specific hotel by its unique identifier
   * @param id - Hotel ID to search for
   * @returns Observable of Hotel object or undefined if not found
   */
  getHotelById(id: string): Observable<Hotel | undefined> {
    return this.loadHotels().pipe(
      map(hotels => hotels.find(h => h.id === id))
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Match scoring
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Intents that indicate the user had specific search intent and should see
   * match scores, regardless of how many explicit criteria the AI extracted.
   */
  // Only intents that are inherently comparative/specific regardless of criteria.
  // Broad completion intents like 'complete_query' and 'show_results_now' are
  // intentionally excluded — the AI uses those for plain "hotels in nyc" too,
  // so they're not reliable signals of a specific search.
  private readonly SPECIFIC_INTENTS = new Set([
    'cheapest', 'most_expensive'
  ]);

  private readonly GENERIC_SENTIMENTS = new Set([
    'NYC', 'New York', 'New York City', 'Near NYC', 'New York State'
  ]);

  /**
   * Returns true when the search is specific enough to warrant showing a %
   * match badge — either because the criteria themselves are specific, or
   * because the AI intent signals the user had more than a generic request.
   */
  isSpecificSearch(
    criteria: SearchCriteria | null | undefined,
    intent?: string | null
  ): boolean {
    // Intent-based shortcut: these always mean a meaningful, specific search
    if (intent && this.SPECIFIC_INTENTS.has(intent)) return true;

    if (!criteria) return false;

    const hasAmenities   = (criteria.amenities?.length ?? 0) > 0;
    const hasBrands      = (criteria.brands?.length ?? 0) > 0;
    const hasPrice       = criteria.priceRange?.min != null || criteria.priceRange?.max != null;
    const hasRating      = criteria.minRating != null;
    // Any sentiment that isn't a bare city name counts as specific
    const hasSpecificLoc = (criteria.sentiments ?? []).some(s => !this.GENERIC_SENTIMENTS.has(s));
    // Multiple sentiments together (e.g. NYC + Luxury) also signal specificity
    const hasMultipleSentiments = (criteria.sentiments?.length ?? 0) >= 2;

    return hasAmenities || hasBrands || hasPrice || hasRating
        || hasSpecificLoc || hasMultipleSentiments;
  }

  /**
   * Enriches each hotel in the array with a `matchScore` (0–99).
   * If the criteria aren't specific enough, `matchScore` is cleared so the
   * card doesn't render a badge.
   *
   * Scoring breakdown (all results already passed the filter):
   *   Amenities   35 pts  how many of the requested amenities the hotel has
   *   Brand       20 pts  brand match
   *   Price       20 pts  how well the price fits the specified range
   *   Rating      15 pts  how far above the minimum rating
   *   Sentiments  10 pts  neighbourhood / vibe match
   *   → scaled to 75–99 range so every shown badge looks meaningful
   */
  computeMatchScores(
    hotels: Hotel[],
    criteria: SearchCriteria | null | undefined,
    intent?: string | null
  ): Hotel[] {
    if (!this.isSpecificSearch(criteria, intent)) {
      // Not a specific enough search — strip any stale scores and return
      return hotels.map(h => ({ ...h, matchScore: undefined }));
    }

    // If intent signals specificity but criteria is sparse, use a thin criteria
    // object so the scoring loop still runs (it will score on hotel quality)
    const effectiveCriteria = criteria ?? {};

    const genericSentiments = new Set([
      'NYC', 'New York', 'New York City', 'Near NYC', 'New York State'
    ]);

    return hotels.map(hotel => {
      let earned = 0;
      let total  = 0;

      // ── Amenities (35 pts) ──────────────────────────────────────────────
      if (effectiveCriteria.amenities?.length) {
        total += 35;
        const matched = effectiveCriteria.amenities.filter(a =>
          hotel.amenities?.some(ha => ha.toLowerCase() === a.toLowerCase())
        ).length;
        earned += (matched / effectiveCriteria.amenities.length) * 35;
      }

      // ── Brand (20 pts) ──────────────────────────────────────────────────
      if (effectiveCriteria.brands?.length) {
        total += 20;
        if (effectiveCriteria.brands.some(b => b.toLowerCase() === hotel.brand?.toLowerCase())) {
          earned += 20;
        }
      }

      // ── Price (20 pts) ──────────────────────────────────────────────────
      if (effectiveCriteria.priceRange?.min != null || effectiveCriteria.priceRange?.max != null) {
        total += 20;
        const price = hotel.pricing.nightlyRate;
        const min   = effectiveCriteria.priceRange?.min ?? 0;
        const max   = effectiveCriteria.priceRange?.max ?? Infinity;

        if (price >= min && price <= max) {
          const headroom = max === Infinity ? 0 : (max - price) / max;
          earned += 14 + headroom * 6; // 14–20 pts
        } else if (max !== Infinity && price <= max * 1.1) {
          earned += 6; // just over budget
        }
      }

      // ── Rating (15 pts) ─────────────────────────────────────────────────
      if (effectiveCriteria.minRating != null) {
        total += 15;
        if (hotel.rating >= effectiveCriteria.minRating) {
          const excess = Math.min(hotel.rating - effectiveCriteria.minRating, 1.5);
          earned += 10 + (excess / 1.5) * 5; // 10–15 pts
        }
      }

      // ── Sentiments / neighbourhood (10 pts) ─────────────────────────────
      const specificSentiments = (effectiveCriteria.sentiments ?? []).filter(
        s => !this.GENERIC_SENTIMENTS.has(s)
      );
      if (specificSentiments.length > 0) {
        total += 10;
        const matched = specificSentiments.filter(s =>
          hotel.sentiment?.some(hs => hs.toLowerCase() === s.toLowerCase())
        ).length;
        earned += (matched / specificSentiments.length) * 10;
      }

      // ── Quality baseline when criteria are sparse ────────────────────────
      // If no explicit criteria dimensions were scored, use hotel rating as a
      // proxy so scores still differ meaningfully across results.
      if (total === 0) {
        total  = 10;
        earned = ((hotel.rating - 3) / 2) * 10; // 3★=0pts, 5★=10pts
      }

      // ── Scale to 75–99 ──────────────────────────────────────────────────
      const pct        = total > 0 ? earned / total : 0;
      const matchScore = Math.min(Math.round(75 + pct * 24), 99);

      // ── Build matchContext so detail views can show ✓/✗ breakdown ────────
      const matchContext: Hotel['matchContext'] = {
        amenities:  effectiveCriteria.amenities ?? [],
        brands:     effectiveCriteria.brands ?? [],
        priceRange: effectiveCriteria.priceRange ?? null,
        minRating:  effectiveCriteria.minRating ?? null,
        sentiments: specificSentiments,
      };

      return { ...hotel, matchScore, matchContext };
    });
  }
}
