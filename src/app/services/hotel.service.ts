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
      brand: this.mapBrandId(raw.brandId),
      rating: raw.rating,
      location: {
        address: raw.location.address,
        neighborhood: raw.sentiment?.[0] || '',
        coordinates: {
          lat: raw.location.lat,
          lng: raw.location.lng
        }
      },
      pricing: {
        nightlyRate: raw.price.nightlyRate,
        roomRate: raw.price.amount,
        fees: raw.price.amount - raw.price.nightlyRate
      },
      amenities: raw.amenities || [],
      description: raw.description,
      imageUrls: raw.imageUrls || [],
      phone: raw.phoneNumber,
      sentiment: raw.sentiment || [],
      bookingUrl: raw.bookingUrl
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
    return hotels.filter(h =>
      h.sentiment.some(s => sentiments.includes(s))
    );
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
    return hotels.filter(h =>
      amenities.some(a => h.amenities.includes(a))
    );
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
   * @param hotels - Array of hotels to filter
   * @param criteria - Search criteria object with optional filter parameters
   * @returns Filtered and sorted array of hotels
   */
  filterHotels(hotels: Hotel[], criteria: SearchCriteria): Hotel[] {
    let filtered = hotels;

    // 1. Brand filter
    if (criteria.brands?.length) {
      filtered = this.filterByBrand(filtered, criteria.brands);
    }

    // 2. Sentiment filter (location/neighborhood)
    if (criteria.sentiments?.length) {
      filtered = this.filterBySentiment(filtered, criteria.sentiments);
    }

    // 3. Price range filter
    if (criteria.priceRange) {
      filtered = this.filterByPrice(
        filtered,
        criteria.priceRange.min,
        criteria.priceRange.max
      );
    }

    // 4. Amenities filter (OR logic)
    if (criteria.amenities?.length) {
      filtered = this.filterByAmenities(filtered, criteria.amenities);
    }

    // 5. Rating filter
    if (criteria.minRating !== undefined) {
      filtered = this.filterByRating(filtered, criteria.minRating);
    }

    // 6. Sort
    if (criteria.sortBy) {
      filtered = this.sortHotels(filtered, criteria.sortBy);
    }

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
}
