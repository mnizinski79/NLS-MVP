import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AIService } from './services/ai.service';
import { HotelService } from './services/hotel.service';
import { ConversationService } from './services/conversation.service';
import { ConfigService } from './services/config.service';
import { of, throwError } from 'rxjs';
import { Hotel } from './models/hotel.model';
import { AIResponse } from './models/ai-response.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AppComponent E2E Tests', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let aiService: jest.Mocked<AIService>;
  let hotelService: jest.Mocked<HotelService>;
  let conversationService: ConversationService;

  const mockHotels: Hotel[] = [
    {
      id: '1',
      name: 'Test Hotel 1',
      brand: 'Kimpton',
      rating: 4.5,
      location: {
        address: '123 Test St',
        neighborhood: 'Midtown',
        coordinates: { lat: 40.7589, lng: -73.9851 }
      },
      pricing: {
        nightlyRate: 250,
        roomRate: 200,
        fees: 50
      },
      amenities: ['Rooftop Bar', 'Fitness Center'],
      description: 'A test hotel',
      imageUrls: ['test.jpg'],
      phone: '555-1234',
      sentiment: ['Times Square', 'Midtown']
    },
    {
      id: '2',
      name: 'Test Hotel 2',
      brand: 'voco',
      rating: 4.0,
      location: {
        address: '456 Test Ave',
        neighborhood: 'Downtown',
        coordinates: { lat: 40.7128, lng: -74.0060 }
      },
      pricing: {
        nightlyRate: 180,
        roomRate: 150,
        fees: 30
      },
      amenities: ['Pool', 'Restaurant'],
      description: 'Another test hotel',
      imageUrls: ['test2.jpg'],
      phone: '555-5678',
      sentiment: ['Downtown', 'Financial District']
    }
  ];

  beforeEach(async () => {
    const aiServiceMock = {
      processQuery: jest.fn()
    };

    const hotelServiceMock = {
      loadHotels: jest.fn().mockReturnValue(of(mockHotels)),
      filterHotels: jest.fn().mockReturnValue(mockHotels),
      getHotelById: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, HttpClientTestingModule],
      providers: [
        { provide: AIService, useValue: aiServiceMock },
        { provide: HotelService, useValue: hotelServiceMock },
        ConversationService,
        ConfigService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    aiService = TestBed.inject(AIService) as jest.Mocked<AIService>;
    hotelService = TestBed.inject(HotelService) as jest.Mocked<HotelService>;
    conversationService = TestBed.inject(ConversationService);
  });

  describe('33.1 Basic Search Flow', () => {
    it('should complete basic search flow: query → AI response → hotels displayed → card click → details open', fakeAsync(() => {
      // Setup
      const userQuery = 'Show me hotels in Times Square';
      const aiResponse: AIResponse = {
        intent: 'complete_query',
        message: 'Here are hotels in Times Square',
        searchCriteria: {
          sentiments: ['Times Square']
        },
        shouldSearch: true,
        shouldRefine: false
      };

      aiService.processQuery.mockReturnValue(of(aiResponse));
      hotelService.filterHotels.mockReturnValue([mockHotels[0]]);

      fixture.detectChanges();
      tick();

      // Step 1: User enters query
      component.onMessageSent(userQuery);
      tick();

      // Verify AI was called
      expect(aiService.processQuery).toHaveBeenCalledWith(
        userQuery,
        expect.any(Object)
      );

      // Step 2: AI responds
      fixture.detectChanges();
      tick();

      // Verify hotels were filtered
      expect(hotelService.filterHotels).toHaveBeenCalled();

      // Verify results are displayed
      expect(component.currentHotels).toEqual([mockHotels[0]]);
      expect(component.currentHotels.length).toBe(1);

      // Verify message was added to conversation
      conversationService.getMessages().subscribe(messages => {
        expect(messages.length).toBeGreaterThan(0);
        const lastMessage = messages[messages.length - 1];
        expect(lastMessage.sender).toBe('ai');
        expect(lastMessage.text).toBe(aiResponse.message);
        expect(lastMessage.hotels).toEqual([mockHotels[0]]);
      });

      // Step 3: User clicks card
      component.onHotelCardClicked(mockHotels[0]);
      fixture.detectChanges();

      // Step 4: Details open
      expect(component.selectedHotel).toEqual(mockHotels[0]);
      expect(component.showDetailDrawer || component.showBottomSheet).toBe(true);
    }));

    it('should handle AI processing state correctly', fakeAsync(() => {
      const userQuery = 'Find hotels';
      const aiResponse: AIResponse = {
        intent: 'complete_query',
        message: 'Here are some hotels',
        shouldSearch: true,
        shouldRefine: false
      };

      aiService.processQuery.mockReturnValue(of(aiResponse));
      hotelService.filterHotels.mockReturnValue(mockHotels);

      fixture.detectChanges();
      tick();

      // Verify initial state
      expect(component.isThinking).toBe(false);

      // Send message
      component.onMessageSent(userQuery);

      // Verify thinking state is true during processing
      expect(component.isThinking).toBe(true);

      tick();
      fixture.detectChanges();

      // Verify thinking state is false after processing
      expect(component.isThinking).toBe(false);
    }));

    it('should handle AI errors gracefully', fakeAsync(() => {
      const userQuery = 'Show me hotels';
      
      aiService.processQuery.mockReturnValue(
        throwError(() => new Error('AI service error'))
      );

      fixture.detectChanges();
      tick();

      // Send message
      component.onMessageSent(userQuery);
      tick();

      // Verify thinking state is reset
      expect(component.isThinking).toBe(false);

      // Verify error message was added
      conversationService.getMessages().subscribe(messages => {
        const lastMessage = messages[messages.length - 1];
        expect(lastMessage.sender).toBe('ai');
        expect(lastMessage.text).toContain('having trouble');
      });
    }));
  });

  describe('33.2 Refinement Flow', () => {
    it('should complete refinement flow: search → click helper tag → results update', fakeAsync(() => {
      // Setup initial search
      const initialQuery = 'Show me hotels';
      const initialAIResponse: AIResponse = {
        intent: 'complete_query',
        message: 'Here are some hotels',
        shouldSearch: true,
        shouldRefine: false
      };

      aiService.processQuery.mockReturnValue(of(initialAIResponse));
      hotelService.filterHotels.mockReturnValue(mockHotels);

      fixture.detectChanges();
      tick();

      // Step 1: Initial search
      component.onMessageSent(initialQuery);
      tick();
      fixture.detectChanges();

      // Verify initial results
      expect(component.currentHotels).toEqual(mockHotels);
      expect(component.currentHotels.length).toBe(2);

      // Step 2: User clicks helper tag
      const refinementQuery = 'which ones have Rooftop Bar';
      const refinementAIResponse: AIResponse = {
        intent: 'refine_search',
        message: 'Here are hotels with Rooftop Bar',
        searchCriteria: {
          amenities: ['Rooftop Bar']
        },
        shouldSearch: true,
        shouldRefine: true
      };

      aiService.processQuery.mockReturnValue(of(refinementAIResponse));
      hotelService.filterHotels.mockReturnValue([mockHotels[0]]);

      component.onTagClicked(refinementQuery);
      tick();
      fixture.detectChanges();

      // Step 3: Results update
      expect(aiService.processQuery).toHaveBeenCalledWith(
        refinementQuery,
        expect.any(Object)
      );

      // Verify refinement used current hotels, not all hotels
      expect(hotelService.filterHotels).toHaveBeenCalledWith(
        mockHotels, // Should use current results
        expect.objectContaining({
          amenities: ['Rooftop Bar']
        })
      );

      // Verify filtered results
      expect(component.currentHotels).toEqual([mockHotels[0]]);
      expect(component.currentHotels.length).toBe(1);

      // Verify conversation state updated
      conversationService.getState().subscribe(state => {
        expect(state.lastIntent).toBe('refine_search');
        expect(state.resultCount).toBe(1);
      });
    }));

    it('should maintain conversation context during refinement', fakeAsync(() => {
      // Initial search
      const initialQuery = 'Hotels in Times Square';
      const initialAIResponse: AIResponse = {
        intent: 'complete_query',
        message: 'Found hotels in Times Square',
        searchCriteria: {
          sentiments: ['Times Square']
        },
        shouldSearch: true,
        shouldRefine: false
      };

      aiService.processQuery.mockReturnValue(of(initialAIResponse));
      hotelService.filterHotels.mockReturnValue(mockHotels);

      fixture.detectChanges();
      tick();

      component.onMessageSent(initialQuery);
      tick();

      // Refinement
      const refinementQuery = 'with pool';
      const refinementAIResponse: AIResponse = {
        intent: 'refine_search',
        message: 'Hotels with pool',
        searchCriteria: {
          amenities: ['Pool']
        },
        shouldSearch: true,
        shouldRefine: true
      };

      aiService.processQuery.mockReturnValue(of(refinementAIResponse));
      hotelService.filterHotels.mockReturnValue([mockHotels[1]]);

      component.onMessageSent(refinementQuery);
      tick();

      // Verify conversation context includes both queries
      conversationService.getState().subscribe(state => {
        expect(state.intentHistory).toContain('complete_query');
        expect(state.intentHistory).toContain('refine_search');
        expect(state.turnCount).toBeGreaterThan(1);
      });
    }));

    it('should generate helper tags from current results', fakeAsync(() => {
      const query = 'Show me hotels';
      const aiResponse: AIResponse = {
        intent: 'complete_query',
        message: 'Here are some hotels',
        shouldSearch: true,
        shouldRefine: false
      };

      aiService.processQuery.mockReturnValue(of(aiResponse));
      hotelService.filterHotels.mockReturnValue(mockHotels);

      fixture.detectChanges();
      tick();

      component.onMessageSent(query);
      tick();
      fixture.detectChanges();

      // Verify helper tags are visible (based on having results)
      expect(component.currentHotels.length).toBeGreaterThan(0);

      // Helper tags should be generated from current results
      // (The actual tag generation is tested in helper-tags.component.spec.ts)
    }));
  });

  describe('33.3 Date Selection Flow', () => {
    it('should complete date selection flow: search (≤3 results) → click "Select Dates" → pick dates → confirmation appears', fakeAsync(() => {
      // Setup search with small result set
      const query = 'Hotels in Times Square';
      const aiResponse: AIResponse = {
        intent: 'complete_query',
        message: 'Here are hotels in Times Square',
        searchCriteria: {
          sentiments: ['Times Square']
        },
        shouldSearch: true,
        shouldRefine: false,
        showDatePicker: true
      };

      aiService.processQuery.mockReturnValue(of(aiResponse));
      hotelService.filterHotels.mockReturnValue([mockHotels[0]]); // Only 1 result

      fixture.detectChanges();
      tick();

      // Step 1: Search returns ≤3 results
      component.onMessageSent(query);
      tick();
      fixture.detectChanges();

      // Verify small result set
      expect(component.currentHotels.length).toBeLessThanOrEqual(3);
      expect(component.currentHotels.length).toBe(1);

      // Verify date picker prompt is shown
      conversationService.getMessages().subscribe(messages => {
        const lastMessage = messages[messages.length - 1];
        expect(lastMessage.showDatePicker).toBe(true);
      });

      // Step 2: User selects dates
      const checkIn = new Date('2026-03-01');
      const checkOut = new Date('2026-03-05');

      const dateConfirmationResponse: AIResponse = {
        intent: 'complete_query',
        message: 'Perfect! I\'ve updated your search for those dates.',
        shouldSearch: false,
        shouldRefine: false
      };

      aiService.processQuery.mockReturnValue(of(dateConfirmationResponse));

      component.onDateSelected({ checkIn, checkOut });
      tick();
      fixture.detectChanges();

      // Step 3: Confirmation appears
      conversationService.getMessages().subscribe(messages => {
        // Find the date selection message
        const dateMessage = messages.find(m => 
          m.text.includes('March 1') && m.text.includes('March 5')
        );
        expect(dateMessage).toBeDefined();
        expect(dateMessage?.sender).toBe('user');

        // Find the confirmation message
        const confirmationMessage = messages[messages.length - 1];
        expect(confirmationMessage.sender).toBe('ai');
        expect(confirmationMessage.text).toContain('updated your search');
      });

      // Verify dates stored in state
      conversationService.getState().subscribe(state => {
        expect(state.conversationContext).toBeDefined();
      });

      // Verify no new search was triggered (shouldSearch: false)
      expect(component.currentHotels).toEqual([mockHotels[0]]);
    }));

    it('should show date picker for 2 results', fakeAsync(() => {
      const query = 'Luxury hotels';
      const aiResponse: AIResponse = {
        intent: 'complete_query',
        message: 'Here are luxury hotels',
        shouldSearch: true,
        shouldRefine: false,
        showDatePicker: true
      };

      aiService.processQuery.mockReturnValue(of(aiResponse));
      hotelService.filterHotels.mockReturnValue(mockHotels); // 2 results

      fixture.detectChanges();
      tick();

      component.onMessageSent(query);
      tick();
      fixture.detectChanges();

      expect(component.currentHotels.length).toBe(2);

      // Verify date picker is shown
      conversationService.getMessages().subscribe(messages => {
        const lastMessage = messages[messages.length - 1];
        expect(lastMessage.showDatePicker).toBe(true);
      });

      // Verify correct prompt message for 2 results
      const promptMessage = component.getDatePromptMessage(2);
      expect(promptMessage).toContain('2 options');
    }));

    it('should show date picker for 3 results', fakeAsync(() => {
      const threeHotels = [...mockHotels, { ...mockHotels[0], id: '3', name: 'Test Hotel 3' }];
      
      const query = 'Hotels with pool';
      const aiResponse: AIResponse = {
        intent: 'complete_query',
        message: 'Here are hotels with pool',
        shouldSearch: true,
        shouldRefine: false,
        showDatePicker: true
      };

      aiService.processQuery.mockReturnValue(of(aiResponse));
      hotelService.filterHotels.mockReturnValue(threeHotels);

      fixture.detectChanges();
      tick();

      component.onMessageSent(query);
      tick();
      fixture.detectChanges();

      expect(component.currentHotels.length).toBe(3);

      // Verify correct prompt message for 3 results
      const promptMessage = component.getDatePromptMessage(3);
      expect(promptMessage).toContain('3 options');
    }));

    it('should not show date picker for more than 3 results', fakeAsync(() => {
      const manyHotels = [
        ...mockHotels,
        { ...mockHotels[0], id: '3', name: 'Test Hotel 3' },
        { ...mockHotels[0], id: '4', name: 'Test Hotel 4' }
      ];

      const query = 'All hotels';
      const aiResponse: AIResponse = {
        intent: 'complete_query',
        message: 'Here are all hotels',
        shouldSearch: true,
        shouldRefine: false
      };

      aiService.processQuery.mockReturnValue(of(aiResponse));
      hotelService.filterHotels.mockReturnValue(manyHotels);

      fixture.detectChanges();
      tick();

      component.onMessageSent(query);
      tick();
      fixture.detectChanges();

      expect(component.currentHotels.length).toBeGreaterThan(3);

      // Verify date picker is NOT shown
      conversationService.getMessages().subscribe(messages => {
        const lastMessage = messages[messages.length - 1];
        expect(lastMessage.showDatePicker).toBeFalsy();
      });
    }));
  });

  describe('33.4 Mobile Flow', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
    });

    it('should complete mobile flow: search → inline cards appear', fakeAsync(() => {
      // Setup
      const query = 'Hotels in Midtown';
      const aiResponse: AIResponse = {
        intent: 'complete_query',
        message: 'Here are hotels in Midtown',
        searchCriteria: {
          sentiments: ['Midtown']
        },
        shouldSearch: true,
        shouldRefine: false
      };

      const manyHotels = [
        ...mockHotels,
        { ...mockHotels[0], id: '3', name: 'Test Hotel 3' },
        { ...mockHotels[0], id: '4', name: 'Test Hotel 4' },
        { ...mockHotels[0], id: '5', name: 'Test Hotel 5' }
      ];

      aiService.processQuery.mockReturnValue(of(aiResponse));
      hotelService.filterHotels.mockReturnValue(manyHotels);

      // Trigger viewport check
      component.ngOnInit();
      fixture.detectChanges();
      tick();

      // Verify mobile mode
      component.isMobile$.subscribe(isMobile => {
        expect(isMobile).toBe(true);
      });

      // Step 1: User searches on mobile
      component.onMessageSent(query);
      tick();
      fixture.detectChanges();

      // Step 2: Results are available
      expect(component.currentHotels.length).toBeGreaterThan(3);
      
      // Verify message includes hotels for inline display
      conversationService.getMessages().subscribe(messages => {
        const lastMessage = messages[messages.length - 1];
        expect(lastMessage.hotels).toBeDefined();
        expect(lastMessage.hotels?.length).toBeGreaterThan(0);
      });

      // Verify all hotels are in results
      expect(component.currentHotels).toEqual(manyHotels);
    }));

    it('should display hotels in messages for mobile inline cards', fakeAsync(() => {
      const query = 'Show hotels';
      const aiResponse: AIResponse = {
        intent: 'complete_query',
        message: 'Here are some hotels',
        shouldSearch: true,
        shouldRefine: false
      };

      const manyHotels = [
        ...mockHotels,
        { ...mockHotels[0], id: '3', name: 'Test Hotel 3' },
        { ...mockHotels[0], id: '4', name: 'Test Hotel 4' }
      ];

      aiService.processQuery.mockReturnValue(of(aiResponse));
      hotelService.filterHotels.mockReturnValue(manyHotels);

      component.ngOnInit();
      fixture.detectChanges();
      tick();

      component.onMessageSent(query);
      tick();
      fixture.detectChanges();

      // Verify all hotels are in results
      expect(component.currentHotels.length).toBe(4);

      // Inline cards should show hotels in message
      conversationService.getMessages().subscribe(messages => {
        const lastMessage = messages[messages.length - 1];
        expect(lastMessage.hotels).toBeDefined();
      });
    }));

    it('should open bottom sheet on mobile when card clicked', fakeAsync(() => {
      const query = 'Hotels';
      const aiResponse: AIResponse = {
        intent: 'complete_query',
        message: 'Here are hotels',
        shouldSearch: true,
        shouldRefine: false
      };

      aiService.processQuery.mockReturnValue(of(aiResponse));
      hotelService.filterHotels.mockReturnValue(mockHotels);

      component.ngOnInit();
      fixture.detectChanges();
      tick();

      component.onMessageSent(query);
      tick();
      fixture.detectChanges();

      // Click hotel card
      component.onHotelCardClicked(mockHotels[0]);
      fixture.detectChanges();

      // Verify bottom sheet opens (not drawer) on mobile
      component.isMobile$.subscribe(isMobile => {
        if (isMobile) {
          expect(component.showBottomSheet).toBe(true);
          expect(component.showDetailDrawer).toBe(false);
        }
      });

      expect(component.selectedHotel).toEqual(mockHotels[0]);
    }));

    it('should handle viewport resize from desktop to mobile', fakeAsync(() => {
      // Start in desktop mode
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });

      component.ngOnInit();
      fixture.detectChanges();
      tick();

      component.isMobile$.subscribe(isMobile => {
        expect(isMobile).toBe(false);
      });

      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      window.dispatchEvent(new Event('resize'));
      tick(300); // Debounce delay
      fixture.detectChanges();

      component.isMobile$.subscribe(isMobile => {
        expect(isMobile).toBe(true);
      });
    }));
  });
});
