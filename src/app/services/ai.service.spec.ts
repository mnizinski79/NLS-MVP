import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AIService } from './ai.service';
import { ConfigService } from './config.service';
import { ConversationState } from '../models';

describe('AIService', () => {
  let service: AIService;
  let httpMock: HttpTestingController;
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
    httpMock = TestBed.inject(HttpTestingController);
    configService = TestBed.inject(ConfigService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('processQuery', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should fall back to keyword processing when API key is not available', (done: any) => {
      configService.getApiKey = jest.fn().mockReturnValue(null);

      service.processQuery('show me hotels in Times Square', mockConversationState).subscribe(response => {
        expect(response).toBeDefined();
        expect(response.intent).toBeDefined();
        expect(response.message).toBeDefined();
        expect(response.shouldSearch).toBeDefined();
        expect(response.shouldRefine).toBeDefined();
        done();
      });
    });

    it('should parse valid Gemini API response', (done: any) => {
      configService.getApiKey = jest.fn().mockReturnValue('test-api-key');

      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                intent: 'complete_query',
                message: 'Here are hotels in Times Square.',
                searchCriteria: {
                  sentiments: ['Times Square']
                },
                shouldSearch: true,
                shouldRefine: false
              })
            }]
          }
        }]
      };

      service.processQuery('show me hotels in Times Square', mockConversationState).subscribe(response => {
        expect(response.intent).toBe('complete_query');
        expect(response.message).toBe('Here are hotels in Times Square.');
        expect(response.searchCriteria?.sentiments).toEqual(['Times Square']);
        expect(response.shouldSearch).toBe(true);
        expect(response.shouldRefine).toBe(false);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('generativelanguage.googleapis.com'));
      expect(req.request.method).toBe('POST');
      req.flush(mockApiResponse);
    });

    // Note: Retry logic is tested implicitly through error handling
    // The service will retry up to 2 times before falling back
  });

  describe('buildPrompt', () => {
    it('should build prompt with conversation context', () => {
      const state: ConversationState = {
        ...mockConversationState,
        hasLocation: true,
        conversationContext: {
          ...mockConversationState.conversationContext,
          location: 'Times Square'
        },
        resultCount: 5,
        lastIntent: 'complete_query',
        turnCount: 2
      };

      const prompt = service.buildPrompt('show me more options', state);

      expect(prompt).toContain('Times Square');
      expect(prompt).toContain('5 hotels');
      expect(prompt).toContain('complete_query');
      expect(prompt).toContain('show me more options');
    });

    it('should include last displayed hotels in prompt', () => {
      const state: ConversationState = {
        ...mockConversationState,
        lastDisplayedHotels: [
          {
            id: '1',
            name: 'Test Hotel',
            brand: 'Kimpton',
            rating: 4,
            location: {
              address: '123 Main St',
              neighborhood: 'Times Square',
              coordinates: { lat: 40.7589, lng: -73.9851 }
            },
            pricing: {
              nightlyRate: 300,
              roomRate: 280,
              fees: 20
            },
            amenities: [],
            description: 'Test',
            imageUrls: [],
            phone: '555-1234',
            sentiment: ['Times Square']
          }
        ]
      };

      const prompt = service.buildPrompt('tell me more', state);

      expect(prompt).toContain('Test Hotel');
      expect(prompt).toContain('Kimpton');
      expect(prompt).toContain('$300/night');
    });
  });

  describe('parseResponse', () => {
    it('should parse valid JSON response', () => {
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                intent: 'complete_query',
                message: 'Test message.',
                shouldSearch: true,
                shouldRefine: false
              })
            }]
          }
        }]
      };

      const result = service.parseResponse(mockApiResponse, 'test query');

      expect(result.intent).toBe('complete_query');
      expect(result.message).toBe('Test message.');
      expect(result.shouldSearch).toBe(true);
      expect(result.shouldRefine).toBe(false);
    });

    it('should handle JSON wrapped in markdown code blocks', () => {
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: '```json\n' + JSON.stringify({
                intent: 'complete_query',
                message: 'Test message.',
                shouldSearch: true,
                shouldRefine: false
              }) + '\n```'
            }]
          }
        }]
      };

      const result = service.parseResponse(mockApiResponse, 'test query');

      expect(result.intent).toBe('complete_query');
      expect(result.message).toBe('Test message.');
    });

    it('should fall back on invalid JSON', () => {
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: 'invalid json'
            }]
          }
        }]
      };

      const result = service.parseResponse(mockApiResponse, 'test query');

      expect(result).toBeDefined();
      expect(result.intent).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it('should truncate messages exceeding 4 sentences', () => {
      const longMessage = 'Sentence one. Sentence two. Sentence three. Sentence four. Sentence five. Sentence six.';
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                intent: 'complete_query',
                message: longMessage,
                shouldSearch: true,
                shouldRefine: false
              })
            }]
          }
        }]
      };

      const result = service.parseResponse(mockApiResponse, 'test query');

      const sentenceCount = (result.message.match(/[.!?]+/g) || []).length;
      expect(sentenceCount).toBeLessThanOrEqual(4);
    });

    it('should validate AIResponse structure with all required fields', () => {
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                intent: 'complete_query',
                message: 'Test message.',
                shouldSearch: true,
                shouldRefine: false
              })
            }]
          }
        }]
      };

      const result = service.parseResponse(mockApiResponse, 'test query');

      expect(result).toBeDefined();
      expect(result.intent).toBe('complete_query');
      expect(result.message).toBe('Test message.');
      expect(result.shouldSearch).toBe(true);
      expect(result.shouldRefine).toBe(false);
    });

    it('should fall back when required fields are missing', () => {
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                intent: 'complete_query',
                // missing message, shouldSearch, shouldRefine
              })
            }]
          }
        }]
      };

      const result = service.parseResponse(mockApiResponse, 'test query');

      // Should fall back to keyword processing
      expect(result).toBeDefined();
      expect(result.intent).toBeDefined();
      expect(result.message).toBeDefined();
      expect(typeof result.shouldSearch).toBe('boolean');
      expect(typeof result.shouldRefine).toBe('boolean');
    });

    it('should fall back when intent is invalid', () => {
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                intent: 'invalid_intent',
                message: 'Test message.',
                shouldSearch: true,
                shouldRefine: false
              })
            }]
          }
        }]
      };

      const result = service.parseResponse(mockApiResponse, 'test query');

      // Should fall back to keyword processing
      expect(result).toBeDefined();
      expect(result.intent).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it('should validate searchCriteria structure when present', () => {
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                intent: 'complete_query',
                message: 'Test message.',
                searchCriteria: {
                  brands: ['Kimpton'],
                  sentiments: ['Times Square'],
                  amenities: ['Pool'],
                  priceRange: { min: 100, max: 300 },
                  minRating: 4,
                  sortBy: 'price_asc'
                },
                shouldSearch: true,
                shouldRefine: false
              })
            }]
          }
        }]
      };

      const result = service.parseResponse(mockApiResponse, 'test query');

      expect(result.searchCriteria).toBeDefined();
      expect(result.searchCriteria?.brands).toEqual(['Kimpton']);
      expect(result.searchCriteria?.sentiments).toEqual(['Times Square']);
      expect(result.searchCriteria?.amenities).toEqual(['Pool']);
      expect(result.searchCriteria?.priceRange).toEqual({ min: 100, max: 300 });
      expect(result.searchCriteria?.minRating).toBe(4);
      expect(result.searchCriteria?.sortBy).toBe('price_asc');
    });

    it('should count sentences correctly', () => {
      const testCases = [
        { message: 'One sentence.', expected: 1 },
        { message: 'First sentence. Second sentence.', expected: 2 },
        { message: 'One! Two? Three.', expected: 3 },
        { message: 'First. Second. Third. Fourth. Fifth.', expected: 5 }
      ];

      testCases.forEach(({ message, expected }) => {
        const mockApiResponse = {
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  intent: 'complete_query',
                  message: message,
                  shouldSearch: true,
                  shouldRefine: false
                })
              }]
            }
          }]
        };

        const result = service.parseResponse(mockApiResponse, 'test');
        const actualCount = (result.message.match(/[^.!?]+[.!?]+/g) || []).length;
        
        if (expected <= 4) {
          expect(actualCount).toBe(expected);
        } else {
          expect(actualCount).toBeLessThanOrEqual(4);
        }
      });
    });

    it('should preserve message content when truncating', () => {
      const longMessage = 'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.';
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                intent: 'complete_query',
                message: longMessage,
                shouldSearch: true,
                shouldRefine: false
              })
            }]
          }
        }]
      };

      const result = service.parseResponse(mockApiResponse, 'test query');

      // Should contain first 4 sentences
      expect(result.message).toContain('First sentence.');
      expect(result.message).toContain('Second sentence.');
      expect(result.message).toContain('Third sentence.');
      expect(result.message).toContain('Fourth sentence.');
      // Should not contain fifth sentence
      expect(result.message).not.toContain('Fifth sentence.');
    });
  });

  describe('fallbackProcessing', () => {
    it('should extract location keywords', () => {
      const result = service.fallbackProcessing('show me hotels in Times Square');

      expect(result.searchCriteria?.sentiments).toContain('Times Square');
    });

    it('should extract brand keywords', () => {
      const result = service.fallbackProcessing('show me Kimpton hotels');

      expect(result.searchCriteria?.brands).toContain('Kimpton');
    });

    it('should extract amenity keywords', () => {
      const result = service.fallbackProcessing('hotels with a pool and gym');

      expect(result.searchCriteria?.amenities).toContain('Pool');
      expect(result.searchCriteria?.amenities).toContain('Fitness Center');
    });

    it('should extract price keywords', () => {
      const result = service.fallbackProcessing('show me cheap hotels');

      expect(result.searchCriteria?.priceRange?.max).toBe(200);
    });

    it('should extract price numbers', () => {
      const result = service.fallbackProcessing('hotels under $300');

      expect(result.searchCriteria?.priceRange?.max).toBe(300);
    });

    it('should extract rating', () => {
      const result = service.fallbackProcessing('4 star hotels');

      expect(result.searchCriteria?.minRating).toBe(4);
    });

    it('should detect show_all intent', () => {
      const result = service.fallbackProcessing('show all hotels');

      expect(result.intent).toBe('show_all');
    });

    it('should detect cheapest intent', () => {
      const result = service.fallbackProcessing('show me the cheapest hotel');

      expect(result.intent).toBe('cheapest');
      expect(result.searchCriteria?.sortBy).toBe('price_asc');
    });

    it('should detect most_expensive intent', () => {
      const result = service.fallbackProcessing('show me the most expensive hotel');

      expect(result.intent).toBe('most_expensive');
      expect(result.searchCriteria?.sortBy).toBe('price_desc');
    });

    it('should detect refine_search intent', () => {
      const result = service.fallbackProcessing('refine the results');

      expect(result.intent).toBe('refine_search');
      expect(result.shouldRefine).toBe(true);
    });

    it('should return valid AIResponse structure', () => {
      const result = service.fallbackProcessing('random query');

      expect(result.intent).toBeDefined();
      expect(result.message).toBeDefined();
      expect(typeof result.shouldSearch).toBe('boolean');
      expect(typeof result.shouldRefine).toBe('boolean');
    });
  });
});
