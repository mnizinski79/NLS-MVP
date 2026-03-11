import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, fromEvent, Subscription } from 'rxjs';
import { map, startWith, distinctUntilChanged, shareReplay, take, switchMap } from 'rxjs/operators';
import { DesktopLayoutComponent } from './components/desktop-layout.component';
import { MobileLayoutComponent } from './components/mobile-layout.component';
import { LandingComponent } from './components/landing.component';
import { PasswordGateComponent } from './components/password-gate.component';
import { HotelService } from './services/hotel.service';
import { AIService } from './services/ai.service';
import { ConversationService } from './services/conversation.service';
import { ConfigService } from './services/config.service';
import { AuthService } from './services/auth.service';
import { Hotel, Message, AIResponse, ConversationState, PointOfInterest } from './models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DesktopLayoutComponent, MobileLayoutComponent, LandingComponent, PasswordGateComponent],
  template: `
    <div class="app-container">
      <!-- Password Gate -->
      <app-password-gate
        *ngIf="showPasswordGate"
        (authenticated)="onPasswordSubmit($event)"
        #passwordGate
      ></app-password-gate>

      <!-- Main App Content -->
      <ng-container *ngIf="isAuthenticated">
        <!-- Landing Screen -->
        <app-landing
          *ngIf="showLanding"
          [visible]="showLanding"
          (messageSent)="onMessageSent($event)"
          (dismissed)="onLandingDismissed()"
        ></app-landing>
        
        <!-- Desktop Layout -->
        <app-desktop-layout
          *ngIf="!showLanding && !(isMobile$ | async)"
          [messages]="messages"
          [isThinking]="isThinking"
          [hotels]="currentHotels"
          [selectedHotel]="selectedHotel"
          [showDetailDrawer]="showDetailDrawer"
          [inputDisabled]="inputDisabled"
          [mapCenter]="mapCenter"
          [mapZoom]="mapZoom"
          [hasDates]="hasDates"
          [checkInDate]="checkInDate"
          [checkOutDate]="checkOutDate"
          [guestCount]="guestCount"
          [adults]="adults"
          [children]="children"
          [pointOfInterest]="pointOfInterest"
          (messageSent)="onMessageSent($event)"
          (tagClicked)="onTagClicked($event)"
          (hotelCardClicked)="onHotelCardClicked($event)"
          (markerClicked)="onMarkerClicked($event)"
          (detailDrawerClosed)="onDetailDrawerClosed()"
          (dateSelected)="onDateSelected($event)"
          (hotelFocused)="onHotelFocused($event)"
          (hotelUnfocused)="onHotelUnfocused()"
          (selectDatesRequested)="onSelectDatesRequested($event)"
        ></app-desktop-layout>
        
        <!-- Mobile Layout -->
        <app-mobile-layout
          *ngIf="!showLanding && (isMobile$ | async)"
          [messages]="messages"
          [isThinking]="isThinking"
          [hotels]="currentHotels"
          [selectedHotel]="selectedHotel"
          [showBottomSheet]="showBottomSheet"
          [isMapContext]="isMapContext"
          [inputDisabled]="inputDisabled"
          [mapCenter]="mapCenter"
          [mapZoom]="mapZoom"
          [hasDates]="hasDates"
          [checkInDate]="checkInDate"
          [checkOutDate]="checkOutDate"
          [guestCount]="guestCount"
          [adults]="adults"
          [children]="children"
          [pointOfInterest]="pointOfInterest"
          (messageSent)="onMessageSent($event)"
          (tagClicked)="onTagClicked($event)"
          (hotelCardClicked)="onHotelCardClicked($event)"
          (markerClicked)="onMarkerClicked($event)"
          (bottomSheetClosed)="onBottomSheetClosed()"
          (dateSelected)="onDateSelected($event)"
          (selectDatesRequested)="onSelectDatesRequested($event)"
        ></app-mobile-layout>
      </ng-container>
    </div>
  `,
  styles: [`
    .app-container {
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'hotel-search';

  // Viewport detection
  isMobile$: Observable<boolean>;

  // Authentication
  @ViewChild('passwordGate') passwordGate?: PasswordGateComponent;
  showPasswordGate = false;
  isAuthenticated = false;

  // State
  showLanding = true;
  allHotels: Hotel[] = [];
  currentHotels: Hotel[] = [];
  messages: Message[] = [];
  isThinking = false;
  selectedHotel: Hotel | null = null;
  showDetailDrawer = false;
  showBottomSheet = false;
  isMapContext = false; // Track if hotel was selected from map overlay
  inputDisabled = false;
  mapCenter: [number, number] = [40.7580, -73.9855]; // NYC default
  mapZoom = 13;
  hasDates = false; // Track if user has selected dates
  checkInDate: Date | null = null; // Check-in date from conversation state
  checkOutDate: Date | null = null; // Check-out date from conversation state
  guestCount: number | null = null; // Guest count from conversation state - DEPRECATED
  adults: number | null = null; // Number of adults from AI response
  children: number | null = null; // Number of children from AI response
  pointOfInterest: PointOfInterest | null = null; // POI from conversation state

  // Request cancellation
  private currentAIRequest$: Subscription | null = null;

  constructor(
    private hotelService: HotelService,
    private aiService: AIService,
    private conversationService: ConversationService,
    private configService: ConfigService,
    private authService: AuthService
  ) {
    // Set up viewport detection
    this.isMobile$ = fromEvent(window, 'resize').pipe(
      startWith(null),
      map(() => window.innerWidth <= 1024),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  ngOnInit(): void {
    console.log('🚀 App component initializing...');
    
    // Load configuration (API keys and password protection) first
    this.configService.loadConfig().subscribe({
      next: (config) => {
        console.log('✅ Configuration loaded successfully', config);
        
        // Check authentication status after config loads
        this.authService.isAuthenticated().subscribe(authenticated => {
          this.isAuthenticated = authenticated;
          this.showPasswordGate = !authenticated && this.authService.isPasswordProtectionEnabled();
        });
      },
      error: (error) => {
        console.error('❌ Failed to load configuration:', error);
        // If config fails, allow access (fail open)
        this.isAuthenticated = true;
        this.showPasswordGate = false;
      }
    });

    // Load hotel data on initialization
    this.loadHotels();

    // Subscribe to messages
    this.conversationService.getMessages().subscribe(messages => {
      this.messages = messages;
    });

    // Subscribe to conversation state to track dates and guest count
    this.conversationService.getState().subscribe(state => {
      this.checkInDate = state.conversationContext.checkIn;
      this.checkOutDate = state.conversationContext.checkOut;
      this.guestCount = state.conversationContext.guestCount;
      this.pointOfInterest = state.pointOfInterest;
      
      // Update hasDates flag
      if (this.checkInDate && this.checkOutDate) {
        this.hasDates = true;
      }
    });

    console.log('✅ App component initialized');
  }

  ngOnDestroy(): void {
    // Cancel any in-flight requests
    if (this.currentAIRequest$) {
      this.currentAIRequest$.unsubscribe();
    }
  }

  /**
   * Load hotels from service
   */
  private loadHotels(): void {
    this.hotelService.loadHotels().subscribe({
      next: (hotels) => {
        this.allHotels = hotels;
        console.log(`Loaded ${hotels.length} hotels`);
      },
      error: (error) => {
        console.error('Failed to load hotels:', error);
        // Add error message to chat
        this.conversationService.addMessage({
          id: this.generateMessageId(),
          sender: 'ai',
          text: 'Sorry, I encountered an error loading hotel data. Please refresh the page.',
          timestamp: new Date()
        });
      }
    });
  }

  /**
   * Handle message submission from user
   * Main entry point for user queries:
   * 1. Cancels any in-flight AI requests
   * 2. Adds user message to chat
   * 3. Shows thinking animation
   * 4. Processes query with AI service
   * 5. Handles response or error
   */
  onMessageSent(message: string): void {
    // Cancel any in-flight AI request to prevent race conditions
    // This ensures only the latest query is processed
    if (this.currentAIRequest$) {
      this.currentAIRequest$.unsubscribe();
      this.currentAIRequest$ = null;
    }

    // Add user message to chat immediately for responsive UX
    const userMessage: Message = {
      id: this.generateMessageId(),
      sender: 'user',
      text: message,
      timestamp: new Date()
    };
    this.conversationService.addMessage(userMessage);

    // Show thinking animation and disable input during processing
    this.isThinking = true;
    this.inputDisabled = true;

    // Get current conversation state and process query with AI
    // State includes conversation history, last displayed hotels, and context
    this.conversationService.getState().pipe(
      take(1),
      switchMap(state => {
        // Process query with AI - includes timeout, retry, and fallback logic
        return this.aiService.processQuery(message, state);
      })
    ).subscribe({
      next: (aiResponse) => {
        // Handle successful AI response
        this.handleAIResponse(message, aiResponse);
      },
      error: (error) => {
        console.error('Error processing message:', error);
        this.isThinking = false;
        this.inputDisabled = false;

        // Add error message to chat (user-friendly, no technical details)
        this.conversationService.addMessage({
          id: this.generateMessageId(),
          sender: 'ai',
          text: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        });
      }
    });
  }

  /**
   * Handle AI response and execute search if needed
   * This is the main orchestration method that:
   * 1. Executes search based on AI intent
   * 2. Updates current hotel results
   * 3. Adds AI message to chat
   * 4. Updates conversation state
   * 5. Auto-opens single result on desktop
   */
  private handleAIResponse(userQuery: string, aiResponse: AIResponse): void {
    console.log('🔍 AI Response:', {
      intent: aiResponse.intent,
      shouldSearch: aiResponse.shouldSearch,
      shouldRefine: aiResponse.shouldRefine,
      criteria: aiResponse.searchCriteria,
      currentHotelsCount: this.currentHotels.length
    });

    let hotels: Hotel[] = [];

    // Execute search based on intent
    // shouldSearch flag determines if we need to filter hotels
    if (aiResponse.shouldSearch) {
      hotels = this.executeSearch(aiResponse);
      console.log('✅ Search executed, found:', hotels.length, 'hotels');
    } else if (aiResponse.shouldRefine) {
      // Handle refinement separately
      hotels = this.handleRefineSearch(aiResponse);
      console.log('✅ Refinement executed, found:', hotels.length, 'hotels');
    } else {
      // Use current hotels for non-search intents (e.g., hotel_info, show_results_now)
      hotels = this.currentHotels;
      console.log('✅ Using current hotels:', hotels.length);
    }

    // Update current hotels for future refinements
    this.currentHotels = hotels;

    // Handle extracted dates from AI response
    if (aiResponse.checkIn && aiResponse.checkOut) {
      console.log('🔍 APP COMPONENT - Dates detected in AI response:', {
        checkIn: aiResponse.checkIn,
        checkOut: aiResponse.checkOut
      });
      
      try {
        // Parse dates in local timezone to avoid timezone offset issues
        // "2026-03-20" should be March 20 in local time, not UTC
        const checkInParts = aiResponse.checkIn.split('-').map(Number);
        const checkInDate = new Date(checkInParts[0], checkInParts[1] - 1, checkInParts[2]);
        
        const checkOutParts = aiResponse.checkOut.split('-').map(Number);
        const checkOutDate = new Date(checkOutParts[0], checkOutParts[1] - 1, checkOutParts[2]);
        
        console.log('🔍 APP COMPONENT - Parsed dates (LOCAL TIME):', {
          checkInDate: checkInDate.toISOString(),
          checkInDay: checkInDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
          checkOutDate: checkOutDate.toISOString(),
          checkOutDay: checkOutDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        });
        
        // Update conversation state with extracted dates
        this.conversationService.getState().pipe(take(1)).subscribe(currentState => {
          const updates: Partial<ConversationState> = {
            conversationContext: {
              ...currentState.conversationContext,
              checkIn: checkInDate,
              checkOut: checkOutDate
            }
          };
          this.conversationService.updateState(updates);
        });
        
        // Set hasDates flag to true
        this.hasDates = true;
        console.log('📅 Dates extracted from query:', {
          checkIn: aiResponse.checkIn,
          checkOut: aiResponse.checkOut
        });
      } catch (error) {
        console.error('Error parsing extracted dates:', error);
      }
    } else {
      console.log('🔍 APP COMPONENT - No dates in AI response');
    }

    // Handle extracted guest count from AI response (adults and children)
    if (aiResponse.adults !== undefined || aiResponse.children !== undefined) {
      // Store adults and children separately
      this.adults = aiResponse.adults ?? null;
      this.children = aiResponse.children ?? null;
      
      this.conversationService.getState().pipe(take(1)).subscribe(currentState => {
        const totalGuests = (aiResponse.adults || 0) + (aiResponse.children || 0);
        const updates: Partial<ConversationState> = {
          conversationContext: {
            ...currentState.conversationContext,
            guestCount: totalGuests > 0 ? totalGuests : null
          }
        };
        this.conversationService.updateState(updates);
      });
      
      console.log('👥 Guest count extracted from query:', {
        adults: aiResponse.adults,
        children: aiResponse.children,
        total: (aiResponse.adults || 0) + (aiResponse.children || 0)
      });
    }

    // Handle extracted POI (Point of Interest) from AI response
    if (aiResponse.pointOfInterest) {
      this.conversationService.updateState({
        pointOfInterest: aiResponse.pointOfInterest
      });
      
      console.log('📍 POI extracted from query:', aiResponse.pointOfInterest);
    }

    // Detect if AI is asking for dates in the message
    const isAskingForDates = /\b(dates?|check-in|check-out|when|arrival|departure)\b.*\b(mind|in mind|thinking|looking|planning)\b/i.test(aiResponse.message) ||
                            /\b(do you have|got any|have any)\b.*\b(dates?|check-in|check-out)\b/i.test(aiResponse.message) ||
                            /\b(specific|any)\b.*\b(dates?|check-in|check-out)\b.*\b(mind|in mind)\b/i.test(aiResponse.message);

    // Show date picker if:
    // 1. AI is explicitly asking for dates in the message, OR
    // 2. Small result sets (1-3 hotels) AND dates weren't already extracted
    // Priority: If AI asks for dates, always show picker (even with >3 results)
    const shouldShowDatePicker = (isAskingForDates && hotels.length > 0) || 
                                 (hotels.length > 0 && hotels.length <= 3 && !this.hasDates && !isAskingForDates);

    console.log('📅 Date picker logic:', {
      isAskingForDates,
      hotelsCount: hotels.length,
      hasDates: this.hasDates,
      shouldShowDatePicker,
      hasPOI: !!aiResponse.pointOfInterest,
      aiMessage: aiResponse.message
    });

    // Add AI message to chat with optional hotel results
    const aiMessage: Message = {
      id: this.generateMessageId(),
      sender: 'ai',
      text: aiResponse.message,
      timestamp: new Date(),
      hotels: hotels.length > 0 ? hotels : undefined,
      showDatePicker: shouldShowDatePicker
    };
    this.conversationService.addMessage(aiMessage);

    // Update conversation state with query, response, and results
    this.updateConversationState(userQuery, aiResponse, hotels);

    // Hide thinking animation and re-enable input
    this.isThinking = false;
    this.inputDisabled = false;

    // Auto-open single result on desktop (width > 1000px)
    // Provides immediate detail view for single results
    if (hotels.length === 1 && window.innerWidth > 1000) {
      setTimeout(() => {
        this.openHotelDetail(hotels[0]);
      }, 300);
    }
  }

  /**
   * Execute search based on AI response
   * Routes to appropriate handler based on intent type:
   * - show_all: Return all hotels without filtering
   * - cheapest/most_expensive: Return single hotel sorted by price (respects shouldRefine)
   * - hotel_info: Return current results (no re-search)
   * - refine_search: Filter current results (not all hotels)
   * - default: Standard search with criteria
   */
  private executeSearch(aiResponse: AIResponse): Hotel[] {
    console.log('🔎 executeSearch called with intent:', aiResponse.intent, 'shouldRefine:', aiResponse.shouldRefine);
    
    // Handle special intents with custom logic
    switch (aiResponse.intent) {
      case 'show_all':
        // Return complete dataset without any filters
        console.log('📋 Showing all hotels');
        return this.allHotels;

      case 'cheapest':
        // Sort by price ascending and return only the first (cheapest) hotel
        // Respects shouldRefine flag and applies any additional filters
        console.log('💰 Finding cheapest hotel');
        return this.handleCheapestIntent(aiResponse);

      case 'most_expensive':
        // Sort by price descending and return only the first (most expensive) hotel
        // Respects shouldRefine flag and applies any additional filters
        console.log('💎 Finding most expensive hotel');
        return this.handleMostExpensiveIntent(aiResponse);

      case 'hotel_info':
        // User is asking about hotels already displayed
        // Return current hotels without re-searching
        console.log('ℹ️ Returning current hotels for info');
        return this.currentHotels;

      case 'refine_search':
        // User is refining current results (e.g., "which ones have a pool?")
        // Filter current hotels, not all hotels
        console.log('🔍 Refining search');
        return this.handleRefineSearch(aiResponse);

      default:
        // Standard search with criteria (brands, location, amenities, price, rating)
        console.log('🔎 Standard search');
        return this.handleStandardSearch(aiResponse);
    }
  }

  /**
   * Handle cheapest intent - return hotels sorted by price ascending
   * If search criteria provided, filter first then sort by price
   */
  private handleCheapestIntent(aiResponse: AIResponse): Hotel[] {
    // Determine base hotels - use current results if refining, otherwise all hotels
    const baseHotels = aiResponse.shouldRefine && this.currentHotels.length > 0
      ? this.currentHotels
      : this.allHotels;
    
    console.log('💰 Cheapest - base hotels:', baseHotels.length, 'shouldRefine:', aiResponse.shouldRefine);
    
    // Apply any additional filters from search criteria
    let filtered = baseHotels;
    if (aiResponse.searchCriteria) {
      console.log('🔧 Applying criteria:', aiResponse.searchCriteria);
      filtered = this.hotelService.filterHotels(baseHotels, aiResponse.searchCriteria);
      console.log('✅ After filtering:', filtered.length, 'hotels');
    }
    
    // Sort by price ascending and return all results
    const sorted = this.hotelService.sortHotels(filtered, 'price_asc');
    console.log('💵 Sorted by price (cheapest first):', sorted.length, 'hotels');
    return sorted;
  }

  /**
   * Handle most expensive intent - return hotels sorted by price descending
   * If search criteria provided, filter first then sort by price
   */
  private handleMostExpensiveIntent(aiResponse: AIResponse): Hotel[] {
    // Determine base hotels - use current results if refining, otherwise all hotels
    const baseHotels = aiResponse.shouldRefine && this.currentHotels.length > 0
      ? this.currentHotels
      : this.allHotels;
    
    console.log('💎 Most expensive - base hotels:', baseHotels.length, 'shouldRefine:', aiResponse.shouldRefine);
    
    // Apply any additional filters from search criteria
    let filtered = baseHotels;
    if (aiResponse.searchCriteria) {
      console.log('🔧 Applying criteria:', aiResponse.searchCriteria);
      filtered = this.hotelService.filterHotels(baseHotels, aiResponse.searchCriteria);
      console.log('✅ After filtering:', filtered.length, 'hotels');
    }
    
    // Sort by price descending and return all results
    const sorted = this.hotelService.sortHotels(filtered, 'price_desc');
    console.log('💎 Sorted by price (most expensive first):', sorted.length, 'hotels');
    return sorted;
  }

  /**
   * Handle refinement - filter current results
   * Refinement means filtering the hotels already displayed,
   * not starting over with all hotels. This preserves the
   * conversational context (e.g., "show me hotels in Midtown"
   * followed by "which ones have a pool?")
   */
  private handleRefineSearch(aiResponse: AIResponse): Hotel[] {
    if (!aiResponse.searchCriteria) {
      return this.currentHotels;
    }

    // Start with current hotels for refinement (not all hotels)
    // If no current hotels, fall back to all hotels
    const baseHotels = this.currentHotels.length > 0 ? this.currentHotels : this.allHotels;
    
    // Apply filter pipeline: brand → sentiment → price → amenities → rating → sort
    return this.hotelService.filterHotels(baseHotels, aiResponse.searchCriteria);
  }

  /**
   * Handle standard search - filter all hotels
   * Standard search starts with the complete hotel dataset
   * and applies filters based on search criteria.
   * Uses shouldRefine flag to determine if we should filter
   * current results or start fresh with all hotels.
   */
  private handleStandardSearch(aiResponse: AIResponse): Hotel[] {
    console.log('🔍 handleStandardSearch - criteria:', aiResponse.searchCriteria);
    
    if (!aiResponse.searchCriteria) {
      console.log('📋 No criteria, returning all hotels');
      return this.allHotels;
    }

    // Determine if this is a refinement or new search
    // shouldRefine flag comes from AI response based on query context
    const baseHotels = aiResponse.shouldRefine && this.currentHotels.length > 0
      ? this.currentHotels  // Refine current results
      : this.allHotels;     // New search from all hotels

    console.log('🏨 Base hotels count:', baseHotels.length);
    console.log('🔎 Search criteria:', JSON.stringify(aiResponse.searchCriteria, null, 2));

    // Apply filter pipeline: brand → sentiment → price → amenities → rating → sort
    const results = this.hotelService.filterHotels(baseHotels, aiResponse.searchCriteria);
    console.log('✅ Filtered results count:', results.length);
    
    return results;
  }

  /**
   * Update conversation state after AI response
   * Maintains conversation context including:
   * - Query/response history
   * - Intent tracking
   * - Search criteria accumulation
   * - Result count and last displayed hotels
   * This state is used by AI to provide contextual responses
   */
  private updateConversationState(
    userQuery: string,
    aiResponse: AIResponse,
    hotels: Hotel[]
  ): void {
    this.conversationService.getState().pipe(take(1)).subscribe(currentState => {
      // Base updates: query, response, intent, turn count
      const updates: Partial<ConversationState> = {
        lastQuery: userQuery,
        lastResponse: aiResponse.message,
        lastIntent: aiResponse.intent,
        intentHistory: [...currentState.intentHistory, aiResponse.intent],
        turnCount: currentState.turnCount + 1,
        resultCount: hotels.length,
        lastDisplayedHotels: hotels  // Used for refinement operations
      };

      // Update conversation context if search criteria provided
      // This accumulates user preferences across the conversation
      if (aiResponse.searchCriteria) {
        const context = { ...currentState.conversationContext };

        // Update brand preferences
        if (aiResponse.searchCriteria.brands) {
          context.brands = aiResponse.searchCriteria.brands;
        }
        
        // Update location/sentiment preferences
        if (aiResponse.searchCriteria.sentiments) {
          context.sentiments = aiResponse.searchCriteria.sentiments;
          updates.hasLocation = true;  // Track that user has specified location
        }
        
        // Update amenity preferences
        if (aiResponse.searchCriteria.amenities) {
          context.amenities = aiResponse.searchCriteria.amenities;
          updates.hasPreferences = true;  // Track that user has specified preferences
        }
        
        // Update price range preferences
        if (aiResponse.searchCriteria.priceRange) {
          context.priceRange = {
            min: aiResponse.searchCriteria.priceRange.min ?? null,
            max: aiResponse.searchCriteria.priceRange.max ?? null
          };
          updates.hasPreferences = true;
        }
        
        // Update rating preferences
        if (aiResponse.searchCriteria.minRating !== undefined) {
          context.minRating = aiResponse.searchCriteria.minRating;
          updates.hasPreferences = true;
        }

        updates.conversationContext = context;
      }

      // Apply all updates to conversation state
      this.conversationService.updateState(updates);
    });
  }

  /**
   * Handle tag click - treat as new message
   */
  onTagClicked(query: string): void {
    this.onMessageSent(query);
  }

  /**
   * Handle hotel card click - open detail view
   */
  onHotelCardClicked(hotel: Hotel): void {
    this.isMapContext = false; // Selected from chat/card view
    this.openHotelDetail(hotel);
  }

  /**
   * Handle map marker click - open detail view
   */
  onMarkerClicked(hotel: Hotel): void {
    this.isMapContext = true; // Selected from map overlay
    this.openHotelDetail(hotel);
  }

  /**
   * Open hotel detail view (drawer on desktop, bottom sheet on mobile)
   */
  private openHotelDetail(hotel: Hotel): void {
    this.selectedHotel = hotel;

    // Update conversation state with focused hotel
    console.log('🏨 Setting focused hotel:', hotel.name, hotel);
    this.conversationService.updateState({
      focusedHotel: hotel
    });

    if (window.innerWidth > 1024) {
      this.showDetailDrawer = true;
    } else {
      this.showBottomSheet = true;
    }
  }

  /**
   * Close detail drawer (desktop)
   */
  onDetailDrawerClosed(): void {
    this.showDetailDrawer = false;
    this.selectedHotel = null;
    
    // Clear focused hotel from conversation state
    this.conversationService.updateState({
      focusedHotel: null
    });
  }

  /**
   * Handle hotel focused event from desktop layout
   * Updates conversation state when detail drawer opens
   */
  onHotelFocused(hotel: Hotel): void {
    console.log('🏨 Setting focused hotel:', hotel.name, hotel);
    this.conversationService.updateState({
      focusedHotel: hotel
    });
  }

  /**
   * Handle hotel unfocused event from desktop layout
   * Clears focused hotel from conversation state when detail drawer closes
   */
  onHotelUnfocused(): void {
    console.log('🏨 Clearing focused hotel');
    this.conversationService.updateState({
      focusedHotel: null
    });
  }

  /**
   * Handle select dates request - add message to chat and show rate calendar
   */
  onSelectDatesRequested(hotel: Hotel): void {
    // Close the detail view (drawer or bottom sheet)
    this.showDetailDrawer = false;
    this.showBottomSheet = false;
    
    // Close mobile map view if open
    this.isMobile$.pipe(take(1)).subscribe(isMobile => {
      if (isMobile) {
        // Access mobile layout component to close map overlay
        // This is handled by the mobile layout component's internal state
        // We just need to ensure the bottom sheet is closed (already done above)
      }
    });
    
    // Add user message to chat
    const userMessage: Message = {
      id: this.generateMessageId(),
      sender: 'user',
      text: `Select dates for ${hotel.name}`,
      timestamp: new Date()
    };
    this.conversationService.addMessage(userMessage);
    
    // Add AI message with rate calendar
    const aiMessage: Message = {
      id: this.generateMessageId(),
      sender: 'ai',
      text: `I'll help you select dates for ${hotel.name}. Choose your check-in and check-out dates below:`,
      timestamp: new Date(),
      showRateCalendar: true,
      rateCalendarHotel: hotel
    };
    this.conversationService.addMessage(aiMessage);
  }

  /**
   * Close bottom sheet (mobile)
   */
  onBottomSheetClosed(): void {
    this.showBottomSheet = false;
    this.selectedHotel = null;
    this.isMapContext = false; // Reset context
    
    // Clear focused hotel from conversation state
    this.conversationService.updateState({
      focusedHotel: null
    });
  }

  /**
   * Handle landing screen dismissal
   */
  onLandingDismissed(): void {
    this.showLanding = false;
  }

  /**
   * Handle password submission
   */
  onPasswordSubmit(event: any): void {
    const password = this.passwordGate?.passwordInput || '';
    const isValid = this.authService.authenticate(password);
    
    if (!isValid && this.passwordGate) {
      this.passwordGate.setError();
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get date prompt message based on result count
   */
  getDatePromptMessage(resultCount: number): string {
    if (resultCount === 1) {
      return "Interested in this one? Add your dates to see live pricing and availability.";
    }
    // Generic message for 2-3 results
    return "You're down to just a few options — do you have dates in mind so I can show you accurate pricing?";
  }

  /**
   * Handle date selection from date picker
   */
  onDateSelected(selection: { checkIn: Date; checkOut: Date }): void {
    // Format the date selection message
    const checkInStr = selection.checkIn.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const checkOutStr = selection.checkOut.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    const message = `I'd like to book from ${checkInStr} to ${checkOutStr}`;
    
    // Update conversation state with dates
    this.conversationService.getState().pipe(take(1)).subscribe(currentState => {
      const updates: Partial<ConversationState> = {
        conversationContext: {
          ...currentState.conversationContext,
          checkIn: selection.checkIn,
          checkOut: selection.checkOut
        }
      };
      this.conversationService.updateState(updates);
    });
    
    // Set hasDates flag to true
    this.hasDates = true;
    
    // Send the message (but don't trigger a new search)
    this.onDateSelectionMessage(message);
  }

  /**
   * Handle date selection message - AI confirms without re-searching
   */
  private onDateSelectionMessage(message: string): void {
    // Add user message to chat
    const userMessage: Message = {
      id: this.generateMessageId(),
      sender: 'user',
      text: message,
      timestamp: new Date()
    };
    this.conversationService.addMessage(userMessage);

    // Show thinking animation briefly
    this.isThinking = true;
    this.inputDisabled = true;

    // Get current conversation state
    this.conversationService.getState().pipe(take(1)).subscribe(state => {
      // Extract dates from the message or state
      const checkIn = state.conversationContext.checkIn;
      const checkOut = state.conversationContext.checkOut;
      
      let confirmationMessage = "Perfect! I've updated your search with those dates. The pricing shown is estimated — I'll have exact rates once you're ready to book.";
      
      if (checkIn && checkOut) {
        const checkInStr = checkIn.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        const checkOutStr = checkOut.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        confirmationMessage = `Perfect! I've updated your search for ${checkInStr} to ${checkOutStr}. The pricing shown is estimated — I'll have exact rates once you're ready to book.`;
      }

      // Add AI confirmation message without triggering new search
      setTimeout(() => {
        const aiMessage: Message = {
          id: this.generateMessageId(),
          sender: 'ai',
          text: confirmationMessage,
          timestamp: new Date()
        };
        this.conversationService.addMessage(aiMessage);

        // Update state
        this.conversationService.updateState({
          lastQuery: message,
          lastResponse: confirmationMessage,
          turnCount: state.turnCount + 1
        });

        this.isThinking = false;
        this.inputDisabled = false;
      }, 500);
    });
  }
}
