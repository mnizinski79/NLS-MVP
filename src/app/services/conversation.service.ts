import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConversationState } from '../models/conversation-state.model';
import { Message } from '../models/message.model';
import { Hotel } from '../models/hotel.model';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private conversationState$ = new BehaviorSubject<ConversationState>({
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
    lastDisplayedHotels: [],
    focusedHotel: null,
    pointOfInterest: null
  });

  private messages$ = new BehaviorSubject<Message[]>([]);

  constructor() { }

  /**
   * Get the current conversation state as an observable
   * Components can subscribe to this to react to state changes
   * @returns Observable stream of conversation state updates
   */
  getState(): Observable<ConversationState> {
    return this.conversationState$.asObservable();
  }

  /**
   * Update the conversation state with partial updates
   * Merges provided updates with current state
   * @param updates - Partial state object with fields to update
   */
  updateState(updates: Partial<ConversationState>): void {
    const currentState = this.conversationState$.value;
    const newState = {
      ...currentState,
      ...updates
    };
    
    // Log focused hotel updates
    if ('focusedHotel' in updates) {
      console.log('📝 Conversation state update - focusedHotel:', updates.focusedHotel?.name || 'null');
      console.log('📝 New state focusedHotel:', newState.focusedHotel?.name || 'null');
    }
    
    this.conversationState$.next(newState);
  }

  /**
   * Add a new message to the conversation history
   * @param message - Message object to add (user or AI message)
   */
  addMessage(message: Message): void {
    const currentMessages = this.messages$.value;
    this.messages$.next([...currentMessages, message]);
  }

  /**
   * Get the message history as an observable
   * Components can subscribe to this to display conversation
   * @returns Observable stream of message array updates
   */
  getMessages(): Observable<Message[]> {
    return this.messages$.asObservable();
  }

  /**
   * Clear all conversation state and message history
   * Resets to initial empty state
   */
  clearConversation(): void {
    this.conversationState$.next({
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
      lastDisplayedHotels: [],
      focusedHotel: null,
      pointOfInterest: null
    });
    this.messages$.next([]);
  }

  /**
   * Get the hotels that were last displayed to the user
   * Used for refinement operations to filter current results
   * @returns Array of hotels from the last search result
   */
  getLastDisplayedHotels(): Hotel[] {
    return this.conversationState$.value.lastDisplayedHotels;
  }
}
