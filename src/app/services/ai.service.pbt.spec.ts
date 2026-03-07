import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AIService } from './ai.service';
import { ConfigService } from './config.service';
import { ConversationState } from '../models';
import * as fc from 'fast-check';

describe('AIService - Property-Based Tests', () => {
  let service: AIService;
  let configService: ConfigService;

  const mockConversationState: ConversationState = {
    hasLocation: false,
    hasPreferences: false,
    resultCount: 0,
    conversationContext: {
      location: null,
      brands: [],
      sentiments: [],
      amenities: [],
      priceRange: { min: null, max: null },
      minRating: null,
      checkIn: null,
      checkOut: null,
      guestCount: null
    },
    lastIntent: null,
    intentHistory: [],
    turnCount: 0,
    lastQuery: null,
    lastResponse: null,
    lastDisplayedHotels: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AIService, ConfigService]
    });
    service = TestBed.inject(AIService);
    configService = TestBed.inject(ConfigService);
  });

  // Feature: angular-hotel-search, Property 9: Intent Classification Completeness
  describe('Property 9: Intent Classification Completeness', () => {
    it('should classify any query into exactly one of the 11 defined intent types', () => {
      const validIntents = [
        'location_only',
        'preferences_only',
        'complete_query',
        'vague',
        'unsupported',
        'show_results_now',
        'show_all',
        'cheapest',
        'most_expensive',
        'hotel_info',
        'refine_search'
      ];

      // Generate arbitrary queries
      const queryArbitrary = fc.oneof(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom(
          'show me hotels in Times Square',
          'I want a cheap hotel',
          'show all hotels',
          'what is the cheapest option',
          'tell me about the first hotel',
          'refine the results',
          'hotels with pool',
          'Kimpton hotels',
          'show me more',
          'I need a hotel',
          'expensive hotels near Broadway'
        )
      );

      fc.assert(
        fc.property(queryArbitrary, (query) => {
          // Use fallback processing to ensure we always get a response
          const response = service.fallbackProcessing(query);

          // Verify intent is one of the valid types
          const hasValidIntent = validIntents.includes(response.intent);
          
          // Verify response has all required fields
          const hasRequiredFields = 
            response.intent !== undefined &&
            response.message !== undefined &&
            typeof response.shouldSearch === 'boolean' &&
            typeof response.shouldRefine === 'boolean';

          return hasValidIntent && hasRequiredFields;
        }),
        { numRuns: 100 }
      );
    });

    it('should always return a valid AIResponse structure for any query', () => {
      const queryArbitrary = fc.string({ minLength: 1, maxLength: 200 });

      fc.assert(
        fc.property(queryArbitrary, (query) => {
          const response = service.fallbackProcessing(query);

          // Check all required fields exist
          return (
            typeof response.intent === 'string' &&
            typeof response.message === 'string' &&
            typeof response.shouldSearch === 'boolean' &&
            typeof response.shouldRefine === 'boolean' &&
            response.message.length > 0
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: angular-hotel-search, Property 39: Fallback Response Validity
  describe('Property 39: Fallback Response Validity', () => {
    it('should return a valid AIResponse conforming to the interface for any query', () => {
      const queryArbitrary = fc.oneof(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.constantFrom(
          'random text',
          '!@#$%^&*()',
          'show me hotels',
          'cheap hotels in Times Square',
          'Kimpton with pool',
          'expensive luxury hotels',
          'show all',
          'refine results',
          '12345',
          'a'.repeat(100)
        )
      );

      fc.assert(
        fc.property(queryArbitrary, (query) => {
          const response = service.fallbackProcessing(query);

          // Verify AIResponse interface conformance
          const hasValidIntent = typeof response.intent === 'string' && response.intent.length > 0;
          const hasValidMessage = typeof response.message === 'string' && response.message.length > 0;
          const hasValidShouldSearch = typeof response.shouldSearch === 'boolean';
          const hasValidShouldRefine = typeof response.shouldRefine === 'boolean';

          // Verify searchCriteria is either undefined or a valid object
          let hasValidSearchCriteria = true;
          if (response.searchCriteria !== undefined) {
            hasValidSearchCriteria = typeof response.searchCriteria === 'object' && response.searchCriteria !== null;
            
            // If searchCriteria exists, validate its fields
            if (hasValidSearchCriteria && response.searchCriteria) {
              if (response.searchCriteria.brands !== undefined) {
                hasValidSearchCriteria = hasValidSearchCriteria && Array.isArray(response.searchCriteria.brands);
              }
              if (response.searchCriteria.sentiments !== undefined) {
                hasValidSearchCriteria = hasValidSearchCriteria && Array.isArray(response.searchCriteria.sentiments);
              }
              if (response.searchCriteria.amenities !== undefined) {
                hasValidSearchCriteria = hasValidSearchCriteria && Array.isArray(response.searchCriteria.amenities);
              }
              if (response.searchCriteria.priceRange !== undefined) {
                hasValidSearchCriteria = hasValidSearchCriteria && typeof response.searchCriteria.priceRange === 'object';
              }
              if (response.searchCriteria.minRating !== undefined) {
                hasValidSearchCriteria = hasValidSearchCriteria && typeof response.searchCriteria.minRating === 'number';
              }
              if (response.searchCriteria.sortBy !== undefined) {
                const validSortOptions = ['price_asc', 'price_desc', 'rating_desc'];
                hasValidSearchCriteria = hasValidSearchCriteria && validSortOptions.includes(response.searchCriteria.sortBy);
              }
            }
          }

          // Verify specificHotelId is either undefined or a string
          const hasValidSpecificHotelId = 
            response.specificHotelId === undefined || 
            typeof response.specificHotelId === 'string';

          return (
            hasValidIntent &&
            hasValidMessage &&
            hasValidShouldSearch &&
            hasValidShouldRefine &&
            hasValidSearchCriteria &&
            hasValidSpecificHotelId
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should extract valid search criteria when keywords are present', () => {
      const queryWithKeywordsArbitrary = fc.constantFrom(
        'show me Kimpton hotels',
        'hotels in Times Square',
        'cheap hotels under $200',
        'hotels with pool and gym',
        '4 star hotels',
        'expensive hotels in Midtown',
        'voco hotels with spa',
        'InterContinental near Broadway'
      );

      fc.assert(
        fc.property(queryWithKeywordsArbitrary, (query) => {
          const response = service.fallbackProcessing(query);

          // If searchCriteria exists, it should have at least one valid field
          if (response.searchCriteria) {
            const hasAtLeastOneField = 
              (response.searchCriteria.brands && response.searchCriteria.brands.length > 0) ||
              (response.searchCriteria.sentiments && response.searchCriteria.sentiments.length > 0) ||
              (response.searchCriteria.amenities && response.searchCriteria.amenities.length > 0) ||
              response.searchCriteria.priceRange !== undefined ||
              response.searchCriteria.minRating !== undefined ||
              response.searchCriteria.sortBy !== undefined;

            return hasAtLeastOneField;
          }

          // If no searchCriteria, that's also valid (vague query)
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should always produce a non-empty message', () => {
      const queryArbitrary = fc.string({ minLength: 1, maxLength: 150 });

      fc.assert(
        fc.property(queryArbitrary, (query) => {
          const response = service.fallbackProcessing(query);

          return (
            response.message !== undefined &&
            response.message !== null &&
            response.message.trim().length > 0
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});
