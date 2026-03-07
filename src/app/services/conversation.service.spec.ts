import { TestBed } from '@angular/core/testing';
import { ConversationService } from './conversation.service';
import { ConversationState } from '../models/conversation-state.model';
import { Message } from '../models/message.model';
import { Hotel } from '../models/hotel.model';

type DoneCallback = () => void;

describe('ConversationService', () => {
  let service: ConversationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConversationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getState', () => {
    it('should return initial state', (done: DoneCallback) => {
      service.getState().subscribe(state => {
        expect(state.hasLocation).toBe(false);
        expect(state.hasPreferences).toBe(false);
        expect(state.resultCount).toBe(0);
        expect(state.turnCount).toBe(0);
        expect(state.lastDisplayedHotels).toEqual([]);
        done();
      });
    });
  });

  describe('updateState', () => {
    it('should update state with partial updates', (done: DoneCallback) => {
      service.updateState({ hasLocation: true, resultCount: 5 });
      
      service.getState().subscribe(state => {
        expect(state.hasLocation).toBe(true);
        expect(state.resultCount).toBe(5);
        expect(state.hasPreferences).toBe(false); // unchanged
        done();
      });
    });

    it('should preserve existing state when updating', (done: DoneCallback) => {
      service.updateState({ 
        hasLocation: true, 
        conversationContext: {
          location: 'Times Square',
          brands: ['Kimpton'],
          sentiments: [],
          amenities: [],
          priceRange: { min: null, max: null },
          minRating: null,
          checkIn: null,
          checkOut: null,
          guestCount: null
        }
      });
      
      service.updateState({ hasPreferences: true });
      
      service.getState().subscribe(state => {
        expect(state.hasLocation).toBe(true);
        expect(state.hasPreferences).toBe(true);
        expect(state.conversationContext.location).toBe('Times Square');
        done();
      });
    });
  });

  describe('addMessage', () => {
    it('should add a message to the messages array', (done: DoneCallback) => {
      const message: Message = {
        id: '1',
        sender: 'user',
        text: 'Hello',
        timestamp: new Date()
      };

      service.addMessage(message);

      service.getMessages().subscribe(messages => {
        expect(messages.length).toBe(1);
        expect(messages[0]).toEqual(message);
        done();
      });
    });

    it('should append messages without removing existing ones', (done: DoneCallback) => {
      const message1: Message = {
        id: '1',
        sender: 'user',
        text: 'Hello',
        timestamp: new Date()
      };

      const message2: Message = {
        id: '2',
        sender: 'ai',
        text: 'Hi there!',
        timestamp: new Date()
      };

      service.addMessage(message1);
      service.addMessage(message2);

      service.getMessages().subscribe(messages => {
        expect(messages.length).toBe(2);
        expect(messages[0]).toEqual(message1);
        expect(messages[1]).toEqual(message2);
        done();
      });
    });
  });

  describe('getMessages', () => {
    it('should return empty array initially', (done: DoneCallback) => {
      service.getMessages().subscribe(messages => {
        expect(messages).toEqual([]);
        done();
      });
    });
  });

  describe('clearConversation', () => {
    it('should reset state to initial values', (done: DoneCallback) => {
      // Set some state
      service.updateState({ 
        hasLocation: true, 
        hasPreferences: true,
        resultCount: 10,
        turnCount: 5
      });

      const message: Message = {
        id: '1',
        sender: 'user',
        text: 'Test',
        timestamp: new Date()
      };
      service.addMessage(message);

      // Clear conversation
      service.clearConversation();

      service.getState().subscribe(state => {
        expect(state.hasLocation).toBe(false);
        expect(state.hasPreferences).toBe(false);
        expect(state.resultCount).toBe(0);
        expect(state.turnCount).toBe(0);
        expect(state.lastDisplayedHotels).toEqual([]);
      });

      service.getMessages().subscribe(messages => {
        expect(messages).toEqual([]);
        done();
      });
    });
  });

  describe('getLastDisplayedHotels', () => {
    it('should return empty array initially', () => {
      const hotels = service.getLastDisplayedHotels();
      expect(hotels).toEqual([]);
    });

    it('should return last displayed hotels from state', () => {
      const mockHotels: Hotel[] = [
        {
          id: '1',
          name: 'Test Hotel',
          brand: 'Kimpton',
          rating: 4.5,
          location: {
            address: '123 Main St',
            neighborhood: 'Midtown',
            coordinates: { lat: 40.7589, lng: -73.9851 }
          },
          pricing: {
            nightlyRate: 300,
            roomRate: 250,
            fees: 50
          },
          amenities: ['WiFi', 'Pool'],
          description: 'A great hotel',
          imageUrls: ['image1.jpg'],
          phone: '555-1234',
          sentiment: ['Times Square']
        }
      ];

      service.updateState({ lastDisplayedHotels: mockHotels });

      const hotels = service.getLastDisplayedHotels();
      expect(hotels).toEqual(mockHotels);
      expect(hotels.length).toBe(1);
      expect(hotels[0].name).toBe('Test Hotel');
    });
  });
});
