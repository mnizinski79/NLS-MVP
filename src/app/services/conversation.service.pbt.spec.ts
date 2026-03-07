import { TestBed } from '@angular/core/testing';
import { ConversationService } from './conversation.service';
import { IntentType } from '../models';
import * as fc from 'fast-check';

describe('ConversationService - Property-Based Tests', () => {
  let service: ConversationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConversationService);
  });

  // Feature: angular-hotel-search, Property 13: Intent History Tracking
  describe('Property 13: Intent History Tracking', () => {
    it('should append each classified intent to the intent history in order', () => {
      const validIntents: IntentType[] = [
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

      // Generate arbitrary sequences of intents
      const intentSequenceArbitrary = fc.array(
        fc.constantFrom(...validIntents),
        { minLength: 1, maxLength: 20 }
      );

      fc.assert(
        fc.property(intentSequenceArbitrary, (intentSequence) => {
          // Clear conversation before each test
          service.clearConversation();

          // Apply each intent update
          intentSequence.forEach((intent, index) => {
            const currentState = service['conversationState$'].value;
            const newHistory = [...currentState.intentHistory, intent];
            
            service.updateState({
              lastIntent: intent,
              intentHistory: newHistory,
              turnCount: index + 1
            });
          });

          // Get final state
          let finalState: any;
          service.getState().subscribe(state => {
            finalState = state;
          });

          // Verify intent history matches the sequence
          const historyMatches = 
            finalState.intentHistory.length === intentSequence.length &&
            intentSequence.every((intent, index) => finalState.intentHistory[index] === intent);

          // Verify last intent is the last in sequence
          const lastIntentMatches = finalState.lastIntent === intentSequence[intentSequence.length - 1];

          // Verify turn count matches sequence length
          const turnCountMatches = finalState.turnCount === intentSequence.length;

          return historyMatches && lastIntentMatches && turnCountMatches;
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain intent history across multiple state updates', () => {
      const validIntents: IntentType[] = [
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

      const intentArbitrary = fc.constantFrom(...validIntents);

      fc.assert(
        fc.property(
          intentArbitrary,
          intentArbitrary,
          intentArbitrary,
          (intent1, intent2, intent3) => {
            // Clear conversation
            service.clearConversation();

            // Add first intent
            service.updateState({
              lastIntent: intent1,
              intentHistory: [intent1]
            });

            // Add second intent
            let currentState: any;
            service.getState().subscribe(state => {
              currentState = state;
            });
            service.updateState({
              lastIntent: intent2,
              intentHistory: [...currentState.intentHistory, intent2]
            });

            // Add third intent
            service.getState().subscribe(state => {
              currentState = state;
            });
            service.updateState({
              lastIntent: intent3,
              intentHistory: [...currentState.intentHistory, intent3]
            });

            // Verify final state
            let finalState: any;
            service.getState().subscribe(state => {
              finalState = state;
            });

            return (
              finalState.intentHistory.length === 3 &&
              finalState.intentHistory[0] === intent1 &&
              finalState.intentHistory[1] === intent2 &&
              finalState.intentHistory[2] === intent3 &&
              finalState.lastIntent === intent3
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve intent history when updating other state properties', () => {
      const validIntents: IntentType[] = [
        'location_only',
        'preferences_only',
        'complete_query'
      ];

      const intentSequenceArbitrary = fc.array(
        fc.constantFrom(...validIntents),
        { minLength: 2, maxLength: 5 }
      );

      fc.assert(
        fc.property(intentSequenceArbitrary, (intentSequence) => {
          // Clear conversation
          service.clearConversation();

          // Build intent history
          intentSequence.forEach((intent, index) => {
            const currentState = service['conversationState$'].value;
            service.updateState({
              lastIntent: intent,
              intentHistory: [...currentState.intentHistory, intent],
              turnCount: index + 1
            });
          });

          // Update other properties without touching intent history
          service.updateState({
            hasLocation: true,
            hasPreferences: true,
            resultCount: 10
          });

          // Verify intent history is preserved
          let finalState: any;
          service.getState().subscribe(state => {
            finalState = state;
          });

          return (
            finalState.intentHistory.length === intentSequence.length &&
            intentSequence.every((intent, index) => finalState.intentHistory[index] === intent) &&
            finalState.hasLocation === true &&
            finalState.hasPreferences === true &&
            finalState.resultCount === 10
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});
