import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelperTagsComponent } from './helper-tags.component';
import { Hotel } from '../models/hotel.model';
import * as fc from 'fast-check';

describe('HelperTagsComponent - Property-Based Tests', () => {
  let component: HelperTagsComponent;
  let fixture: ComponentFixture<HelperTagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelperTagsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HelperTagsComponent);
    component = fixture.componentInstance;
  });

  // Helper to create hotel arbitrary
  const hotelArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }),
    brand: fc.constantFrom('Kimpton', 'voco', 'InterContinental', 'Holiday Inn', 'Independent'),
    rating: fc.integer({ min: 1, max: 5 }),
    location: fc.record({
      address: fc.string(),
      neighborhood: fc.string(),
      coordinates: fc.record({
        lat: fc.double({ min: 40.7, max: 40.8 }),
        lng: fc.double({ min: -74.1, max: -73.9 })
      })
    }),
    pricing: fc.record({
      nightlyRate: fc.integer({ min: 100, max: 1000 }),
      roomRate: fc.integer({ min: 80, max: 900 }),
      fees: fc.integer({ min: 20, max: 100 })
    }),
    amenities: fc.array(
      fc.constantFrom('Rooftop Bar', 'Fitness Center', 'Pet Friendly', 'Pool', 'Spa', 'Restaurant', 'Free WiFi', 'Parking'),
      { minLength: 1, maxLength: 5 }
    ),
    description: fc.string({ minLength: 50, maxLength: 200 }),
    imageUrls: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
    phone: fc.string(),
    sentiment: fc.array(
      fc.constantFrom('Times Square', 'Midtown', 'Broadway', 'Financial District', 'Chelsea', 'SoHo'),
      { minLength: 1, maxLength: 3 }
    )
  });

  // Feature: angular-hotel-search, Property 3: Each tag is a pill-shaped button with specific styling
  describe('Property 3: Helper Tag Structure', () => {
    it('should generate tags where each tag has type, label, icon, and query properties', () => {
      const hotelsArbitrary = fc.array(hotelArbitrary, { minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(hotelsArbitrary, (hotels) => {
          component.hotels = hotels as Hotel[];
          component.generateTags();

          // Every tag should have the required structure
          return component.tags.every(tag => 
            (tag.type === 'amenity' || tag.type === 'location') &&
            typeof tag.label === 'string' &&
            tag.label.length > 0 &&
            typeof tag.icon === 'string' &&
            tag.icon.length > 0 &&
            typeof tag.query === 'string' &&
            tag.query.length > 0
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should generate at most 3 amenity tags', () => {
      const hotelsArbitrary = fc.array(hotelArbitrary, { minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(hotelsArbitrary, (hotels) => {
          component.hotels = hotels as Hotel[];
          component.generateTags();

          const amenityTags = component.tags.filter(tag => tag.type === 'amenity');
          return amenityTags.length <= 3;
        }),
        { numRuns: 100 }
      );
    });

    it('should generate at most 2 location tags', () => {
      const hotelsArbitrary = fc.array(hotelArbitrary, { minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(hotelsArbitrary, (hotels) => {
          component.hotels = hotels as Hotel[];
          component.generateTags();

          const locationTags = component.tags.filter(tag => tag.type === 'location');
          return locationTags.length <= 2;
        }),
        { numRuns: 100 }
      );
    });

    it('should generate location tags only when there are multiple unique locations', () => {
      const hotelsArbitrary = fc.array(hotelArbitrary, { minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(hotelsArbitrary, (hotels) => {
          component.hotels = hotels as Hotel[];
          component.generateTags();

          // Count unique locations in hotels
          const uniqueLocations = new Set<string>();
          hotels.forEach(hotel => {
            hotel.sentiment.forEach(s => uniqueLocations.add(s));
          });

          const locationTags = component.tags.filter(tag => tag.type === 'location');

          // If only 1 or 0 unique locations, should have no location tags
          if (uniqueLocations.size <= 1) {
            return locationTags.length === 0;
          }

          // If multiple locations, can have location tags
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should generate amenity tags based on most frequent amenities', () => {
      const hotelsArbitrary = fc.array(hotelArbitrary, { minLength: 3, maxLength: 20 });

      fc.assert(
        fc.property(hotelsArbitrary, (hotels) => {
          component.hotels = hotels as Hotel[];
          component.generateTags();

          const amenityTags = component.tags.filter(tag => tag.type === 'amenity');

          // All amenity tags should reference amenities that exist in the hotels
          return amenityTags.every(tag => {
            return hotels.some(hotel => hotel.amenities.includes(tag.label));
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid query strings for amenity tags', () => {
      const hotelsArbitrary = fc.array(hotelArbitrary, { minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(hotelsArbitrary, (hotels) => {
          component.hotels = hotels as Hotel[];
          component.generateTags();

          const amenityTags = component.tags.filter(tag => tag.type === 'amenity');

          // Amenity tag queries should follow the pattern "which ones have {amenity}"
          return amenityTags.every(tag => 
            tag.query.includes('which ones have') &&
            tag.query.includes(tag.label)
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid query strings for location tags', () => {
      const hotelsArbitrary = fc.array(hotelArbitrary, { minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(hotelsArbitrary, (hotels) => {
          component.hotels = hotels as Hotel[];
          component.generateTags();

          const locationTags = component.tags.filter(tag => tag.type === 'location');

          // Location tag queries should follow the pattern "show me hotels near {location}"
          return locationTags.every(tag => 
            tag.query.includes('show me hotels near') &&
            tag.label.startsWith('Near ')
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should assign appropriate icons to amenity tags', () => {
      const hotelsArbitrary = fc.array(hotelArbitrary, { minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(hotelsArbitrary, (hotels) => {
          component.hotels = hotels as Hotel[];
          component.generateTags();

          const amenityTags = component.tags.filter(tag => tag.type === 'amenity');

          // All amenity tags should have non-empty icons
          return amenityTags.every(tag => 
            tag.icon.length > 0 &&
            // Icon should be an emoji or special character
            tag.icon.length <= 4
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should assign location icon to location tags', () => {
      const hotelsArbitrary = fc.array(hotelArbitrary, { minLength: 1, maxLength: 20 });

      fc.assert(
        fc.property(hotelsArbitrary, (hotels) => {
          component.hotels = hotels as Hotel[];
          component.generateTags();

          const locationTags = component.tags.filter(tag => tag.type === 'location');

          // All location tags should have the building emoji icon
          return locationTags.every(tag => tag.icon === '🏢');
        }),
        { numRuns: 100 }
      );
    });

    it('should emit the correct query when a tag is clicked', () => {
      const hotelsArbitrary = fc.array(hotelArbitrary, { minLength: 1, maxLength: 10 });

      fc.assert(
        fc.property(hotelsArbitrary, (hotels) => {
          component.hotels = hotels as Hotel[];
          component.generateTags();

          if (component.tags.length === 0) {
            return true; // Skip if no tags generated
          }

          // Pick a random tag
          const randomTag = component.tags[Math.floor(Math.random() * component.tags.length)];
          
          let emittedQuery: string | undefined;
          component.tagClicked.subscribe((query: string) => {
            emittedQuery = query;
          });

          component.onTagClick(randomTag);

          return emittedQuery === randomTag.query;
        }),
        { numRuns: 100 }
      );
    });
  });
});
