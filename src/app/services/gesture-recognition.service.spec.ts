import { TestBed } from '@angular/core/testing';
import { GestureRecognitionService } from './gesture-recognition.service';
import { GestureEvent, DragState } from '../models/map-interaction.model';

describe('GestureRecognitionService', () => {
  let service: GestureRecognitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestureRecognitionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('onTouchStart', () => {
    it('should initialize drag state with touch position', () => {
      const mockEvent = createTouchEvent('touchstart', 100);
      
      service.onTouchStart(mockEvent);
      
      const dragState = service.getDragState();
      expect(dragState).not.toBeNull();
      expect(dragState?.startY).toBe(100);
      expect(dragState?.currentY).toBe(100);
      expect(dragState?.velocityHistory.length).toBe(1);
    });

    it('should handle empty touches array', () => {
      const mockEvent = {
        touches: [] as any,
      } as TouchEvent;
      
      service.onTouchStart(mockEvent);
      
      const dragState = service.getDragState();
      expect(dragState).toBeNull();
    });
  });

  describe('onTouchMove', () => {
    it('should update drag state with new position', () => {
      const startEvent = createTouchEvent('touchstart', 100);
      const moveEvent = createTouchEvent('touchmove', 150);
      
      service.onTouchStart(startEvent);
      const dragState = service.onTouchMove(moveEvent);
      
      expect(dragState).not.toBeNull();
      expect(dragState?.currentY).toBe(150);
      expect(dragState?.startY).toBe(100);
      expect(dragState?.velocityHistory.length).toBeGreaterThan(1);
    });

    it('should return null if no drag state exists', () => {
      const moveEvent = createTouchEvent('touchmove', 150);
      
      const dragState = service.onTouchMove(moveEvent);
      
      expect(dragState).toBeNull();
    });

    it('should return null if touches array is empty', () => {
      const startEvent = createTouchEvent('touchstart', 100);
      const moveEvent = {
        touches: [] as any,
      } as TouchEvent;
      
      service.onTouchStart(startEvent);
      const dragState = service.onTouchMove(moveEvent);
      
      expect(dragState).toBeNull();
    });
  });

  describe('onTouchEnd', () => {
    it('should interpret gesture and clear drag state', () => {
      const startEvent = createTouchEvent('touchstart', 100);
      const endEvent = {} as TouchEvent;
      
      service.onTouchStart(startEvent);
      const gestureEvent = service.onTouchEnd(endEvent);
      
      expect(gestureEvent).not.toBeNull();
      expect(service.getDragState()).toBeNull();
    });

    it('should return null if no drag state exists', () => {
      const endEvent = {} as TouchEvent;
      
      const gestureEvent = service.onTouchEnd(endEvent);
      
      expect(gestureEvent).toBeNull();
    });
  });

  describe('calculateVelocity', () => {
    it('should calculate velocity from last 100ms of drag', () => {
      const now = Date.now();
      const dragState: DragState = {
        startY: 100,
        currentY: 200,
        startTime: now - 200,
        velocityHistory: [
          { y: 100, time: now - 200 },
          { y: 150, time: now - 50 },
          { y: 200, time: now },
        ],
      };
      
      const velocity = service.calculateVelocity(dragState);
      
      // Velocity should be calculated from last 100ms
      // deltaY = 200 - 150 = 50, deltaTime = 50ms
      // velocity = (50 / 50) * 1000 = 1000 px/s
      expect(velocity).toBeCloseTo(1000, 0);
    });

    it('should return 0 if less than 2 points in window', () => {
      const now = Date.now();
      const dragState: DragState = {
        startY: 100,
        currentY: 100,
        startTime: now,
        velocityHistory: [{ y: 100, time: now }],
      };
      
      const velocity = service.calculateVelocity(dragState);
      
      expect(velocity).toBe(0);
    });

    it('should return 0 if deltaTime is 0', () => {
      const now = Date.now();
      const dragState: DragState = {
        startY: 100,
        currentY: 200,
        startTime: now,
        velocityHistory: [
          { y: 100, time: now },
          { y: 200, time: now },
        ],
      };
      
      const velocity = service.calculateVelocity(dragState);
      
      expect(velocity).toBe(0);
    });
  });

  describe('interpretGesture', () => {
    it('should classify as swipe-up for velocity > 300px/s upward', () => {
      const now = Date.now();
      const dragState: DragState = {
        startY: 100,
        currentY: 50,
        startTime: now - 100,
        velocityHistory: [
          { y: 100, time: now - 100 },
          { y: 50, time: now - 10 },
        ],
      };
      
      const gesture = service.interpretGesture(dragState);
      
      expect(gesture.type).toBe('swipe-up');
      expect(gesture.velocity).toBeLessThan(0);
      expect(Math.abs(gesture.velocity)).toBeGreaterThan(300);
    });

    it('should classify as swipe-down for velocity > 300px/s downward', () => {
      const now = Date.now();
      const dragState: DragState = {
        startY: 100,
        currentY: 150,
        startTime: now - 100,
        velocityHistory: [
          { y: 100, time: now - 100 },
          { y: 150, time: now },
        ],
      };
      
      const gesture = service.interpretGesture(dragState);
      
      expect(gesture.type).toBe('swipe-down');
      expect(gesture.velocity).toBeGreaterThan(300);
    });

    it('should classify as swipe-up for deltaY < -100px', () => {
      const now = Date.now();
      const dragState: DragState = {
        startY: 200,
        currentY: 50,
        startTime: now - 500,
        velocityHistory: [
          { y: 200, time: now - 500 },
          { y: 50, time: now },
        ],
      };
      
      const gesture = service.interpretGesture(dragState);
      
      expect(gesture.type).toBe('swipe-up');
      expect(gesture.deltaY).toBeLessThan(-100);
    });

    it('should classify as swipe-down for deltaY > 100px', () => {
      const now = Date.now();
      const dragState: DragState = {
        startY: 100,
        currentY: 250,
        startTime: now - 500,
        velocityHistory: [
          { y: 100, time: now - 500 },
          { y: 250, time: now },
        ],
      };
      
      const gesture = service.interpretGesture(dragState);
      
      expect(gesture.type).toBe('swipe-down');
      expect(gesture.deltaY).toBeGreaterThan(100);
    });

    it('should classify as tap for deltaY < 10px', () => {
      const now = Date.now();
      const dragState: DragState = {
        startY: 100,
        currentY: 105,
        startTime: now - 100,
        velocityHistory: [
          { y: 100, time: now - 100 },
          { y: 105, time: now },
        ],
      };
      
      const gesture = service.interpretGesture(dragState);
      
      expect(gesture.type).toBe('tap');
    });

    it('should classify as drag for insufficient movement', () => {
      const now = Date.now();
      const dragState: DragState = {
        startY: 100,
        currentY: 150,
        startTime: now - 500,
        velocityHistory: [
          { y: 100, time: now - 500 },
          { y: 150, time: now },
        ],
      };
      
      const gesture = service.interpretGesture(dragState);
      
      expect(gesture.type).toBe('drag');
      expect(Math.abs(gesture.deltaY)).toBeLessThanOrEqual(100);
    });

    it('should handle exactly 100px drag threshold', () => {
      const now = Date.now();
      const dragState: DragState = {
        startY: 100,
        currentY: 200,
        startTime: now - 500,
        velocityHistory: [
          { y: 100, time: now - 500 },
          { y: 200, time: now },
        ],
      };
      
      const gesture = service.interpretGesture(dragState);
      
      // Exactly 100px should be classified as drag (not swipe)
      expect(gesture.type).toBe('drag');
    });

    it('should handle exactly 300px/s velocity threshold', () => {
      const now = Date.now();
      const dragState: DragState = {
        startY: 100,
        currentY: 130,
        startTime: now - 100,
        velocityHistory: [
          { y: 100, time: now - 100 },
          { y: 130, time: now },
        ],
      };
      
      const gesture = service.interpretGesture(dragState);
      
      // Exactly 300px/s should not trigger velocity override
      expect(gesture.type).toBe('drag');
    });
  });

  describe('reset', () => {
    it('should clear drag state', () => {
      const startEvent = createTouchEvent('touchstart', 100);
      
      service.onTouchStart(startEvent);
      expect(service.getDragState()).not.toBeNull();
      
      service.reset();
      expect(service.getDragState()).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid gesture sequences', () => {
      const event1 = createTouchEvent('touchstart', 100);
      const event2 = createTouchEvent('touchstart', 200);
      
      service.onTouchStart(event1);
      const state1 = service.getDragState();
      
      service.onTouchStart(event2);
      const state2 = service.getDragState();
      
      // Second touch should override first
      expect(state2?.startY).toBe(200);
      expect(state2?.startY).not.toBe(state1?.startY);
    });

    it('should handle multiple touch move events', () => {
      const startEvent = createTouchEvent('touchstart', 100);
      service.onTouchStart(startEvent);
      
      const move1 = createTouchEvent('touchmove', 120);
      const move2 = createTouchEvent('touchmove', 140);
      const move3 = createTouchEvent('touchmove', 160);
      
      service.onTouchMove(move1);
      service.onTouchMove(move2);
      const finalState = service.onTouchMove(move3);
      
      expect(finalState?.currentY).toBe(160);
      expect(finalState?.velocityHistory.length).toBe(4); // start + 3 moves
    });
  });
});

/**
 * Helper function to create mock touch events
 */
function createTouchEvent(type: string, clientY: number): TouchEvent {
  const touch = {
    clientY,
    clientX: 0,
    identifier: 0,
    pageX: 0,
    pageY: clientY,
    screenX: 0,
    screenY: clientY,
  } as Touch;

  return {
    touches: [touch],
  } as unknown as TouchEvent;
}
