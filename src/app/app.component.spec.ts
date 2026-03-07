import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { HotelService } from './services/hotel.service';
import { AIService } from './services/ai.service';
import { ConversationService } from './services/conversation.service';
import { of, throwError } from 'rxjs';
import { Hotel, AIResponse, Message } from './models';

describe('AppComponent', () => {
  let mockHotelService: Partial<HotelService>;
  let mockAIService: Partial<AIService>;
  let mockConversationService: Partial<ConversationService>;

  const mockHotels: Hotel[] = [
    {
      id: '1',
      name: 'Test Hotel 1',
      brand: 'Kimpton',
      rating: 4.5,
      location: {
        address: '123 Test St',
        neighborhood: 'Midtown',
        coordinates: { lat: 40.7580, lng: -73.9855 }
      },
      pricing: {
        nightlyRate: 200,
        roomRate: 200,
        fees: 0
      },
      amenities: ['WiFi', 'Pool'],
      description: 'Test hotel',
      imageUrls: [],
      phone: '555-1234',
      sentiment: ['Midtown']
    }
  ];

  beforeEach(async () => {
    mockHotelService = {
      loadHotels: jest.fn().mockReturnValue(of(mockHotels)),
      filterHotels: jest.fn().mockReturnValue(mockHotels),
      sortHotels: jest.fn().mockReturnValue(mockHotels)
    };
    
    mockAIService = {
      processQuery: jest.fn()
    };
    
    mockConversationService = {
      getMessages: jest.fn().mockReturnValue(of([])),
      getState: jest.fn().mockReturnValue(of({
        hasLocation: false,
        hasPreferences: false,
        resultCount: 0,
        conversationContext: {
          location: null,
          brands: [],
          sentiments: [],
          amenities: [],
          priceRange: { min: null, max: null },
          minRating: null
        },
        lastIntent: null,
        intentHistory: [],
        turnCount: 0,
        lastQuery: null,
        lastResponse: null,
        lastDisplayedHotels: []
      })),
      updateState: jest.fn(),
      addMessage: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: HotelService, useValue: mockHotelService },
        { provide: AIService, useValue: mockAIService },
        { provide: ConversationService, useValue: mockConversationService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have title as hotel-search', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toBe('hotel-search');
  });

  it('should load hotels on init', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    
    expect(mockHotelService.loadHotels).toHaveBeenCalled();
    expect(fixture.componentInstance.allHotels).toEqual(mockHotels);
  });

  it('should set up viewport detection observable', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    expect(app.isMobile$).toBeDefined();
  });

  it('should handle message submission', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    const mockAIResponse: AIResponse = {
      intent: 'complete_query',
      message: 'Here are some hotels',
      shouldSearch: true,
      shouldRefine: false,
      searchCriteria: {
        sentiments: ['Midtown']
      }
    };
    
    (mockAIService.processQuery as jest.Mock).mockReturnValue(of(mockAIResponse));
    
    app.onMessageSent('Show me hotels in Midtown');
    
    expect(mockConversationService.addMessage).toHaveBeenCalled();
    expect(mockAIService.processQuery).toHaveBeenCalled();
  });

  it('should handle show_all intent', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.allHotels = mockHotels;
    
    const mockAIResponse: AIResponse = {
      intent: 'show_all',
      message: 'Here are all hotels',
      shouldSearch: true,
      shouldRefine: false
    };
    
    (mockAIService.processQuery as jest.Mock).mockReturnValue(of(mockAIResponse));
    
    app.onMessageSent('Show me all hotels');
    
    expect(app.currentHotels).toEqual(mockHotels);
  });

  it('should handle cheapest intent', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.allHotels = mockHotels;
    
    const mockAIResponse: AIResponse = {
      intent: 'cheapest',
      message: 'Here is the cheapest hotel',
      shouldSearch: true,
      shouldRefine: false
    };
    
    (mockAIService.processQuery as jest.Mock).mockReturnValue(of(mockAIResponse));
    
    app.onMessageSent('Show me the cheapest hotel');
    
    expect(mockHotelService.sortHotels).toHaveBeenCalledWith(mockHotels, 'price_asc');
  });

  it('should handle refinement', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.currentHotels = mockHotels;
    
    const mockAIResponse: AIResponse = {
      intent: 'refine_search',
      message: 'Refining your search',
      shouldSearch: true,
      shouldRefine: true,
      searchCriteria: {
        amenities: ['Pool']
      }
    };
    
    (mockAIService.processQuery as jest.Mock).mockReturnValue(of(mockAIResponse));
    
    app.onMessageSent('Show me ones with a pool');
    
    expect(mockHotelService.filterHotels).toHaveBeenCalledWith(
      mockHotels,
      mockAIResponse.searchCriteria
    );
  });

  it('should cancel in-flight requests when new message sent', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    const mockAIResponse: AIResponse = {
      intent: 'complete_query',
      message: 'Searching...',
      shouldSearch: true,
      shouldRefine: false
    };
    
    (mockAIService.processQuery as jest.Mock).mockReturnValue(of(mockAIResponse));
    
    // Send first message
    app.onMessageSent('First query');
    
    // Send second message immediately
    app.onMessageSent('Second query');
    
    // Should have called AI service twice
    expect(mockAIService.processQuery).toHaveBeenCalledTimes(2);
  });

  it('should auto-open detail drawer for single result on desktop', (done) => {
    // Mock window.innerWidth to be > 1000 (desktop)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200
    });

    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.allHotels = mockHotels;
    
    const mockAIResponse: AIResponse = {
      intent: 'complete_query',
      message: 'Here is your hotel',
      shouldSearch: true,
      shouldRefine: false,
      searchCriteria: {
        sentiments: ['Midtown']
      }
    };
    
    (mockHotelService.filterHotels as jest.Mock).mockReturnValue([mockHotels[0]]);
    (mockAIService.processQuery as jest.Mock).mockReturnValue(of(mockAIResponse));
    
    app.onMessageSent('Show me a hotel in Midtown');
    
    // Wait for the 300ms timeout
    setTimeout(() => {
      expect(app.showDetailDrawer).toBe(true);
      expect(app.selectedHotel).toEqual(mockHotels[0]);
      done();
    }, 350);
  });

  it('should not auto-open detail drawer for single result on mobile', (done) => {
    // Mock window.innerWidth to be <= 1000 (mobile)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800
    });

    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.allHotels = mockHotels;
    
    const mockAIResponse: AIResponse = {
      intent: 'complete_query',
      message: 'Here is your hotel',
      shouldSearch: true,
      shouldRefine: false,
      searchCriteria: {
        sentiments: ['Midtown']
      }
    };
    
    (mockHotelService.filterHotels as jest.Mock).mockReturnValue([mockHotels[0]]);
    (mockAIService.processQuery as jest.Mock).mockReturnValue(of(mockAIResponse));
    
    app.onMessageSent('Show me a hotel in Midtown');
    
    // Wait for the 300ms timeout
    setTimeout(() => {
      expect(app.showDetailDrawer).toBe(false);
      expect(app.showBottomSheet).toBe(false);
      done();
    }, 350);
  });

  it('should not auto-open detail drawer for multiple results', (done) => {
    // Mock window.innerWidth to be > 1000 (desktop)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200
    });

    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    // Create multiple hotels
    const multipleHotels: Hotel[] = [
      mockHotels[0],
      {
        ...mockHotels[0],
        id: '2',
        name: 'Test Hotel 2'
      }
    ];
    
    app.allHotels = multipleHotels;
    
    const mockAIResponse: AIResponse = {
      intent: 'complete_query',
      message: 'Here are your hotels',
      shouldSearch: true,
      shouldRefine: false,
      searchCriteria: {
        sentiments: ['Midtown']
      }
    };
    
    (mockHotelService.filterHotels as jest.Mock).mockReturnValue(multipleHotels);
    (mockAIService.processQuery as jest.Mock).mockReturnValue(of(mockAIResponse));
    
    app.onMessageSent('Show me hotels in Midtown');
    
    // Wait for the 300ms timeout
    setTimeout(() => {
      expect(app.showDetailDrawer).toBe(false);
      done();
    }, 350);
  });
});
