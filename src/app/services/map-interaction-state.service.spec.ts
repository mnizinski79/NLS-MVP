import { TestBed } from '@angular/core/testing';
import { MapInteractionStateService } from './map-interaction-state.service';
import {
  MapInteractionState,
  BottomSheetState,
  MapViewport,
} from '../models/map-interaction.model';

describe('MapInteractionStateService', () => {
  let service: MapInteractionStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapInteractionStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = service.getCurrentState();
      expect(state.selectedHotelId).toBeNull();
      expect(state.bottomSheetState).toBe('dismissed');
      expect(state.originalMapViewport).toBeNull();
      expect(state.isAnimating).toBe(false);
      expect(state.isDragging).toBe(false);
    });
  });

  describe('selectHotel', () => {
    it('should update selectedHotelId and set bottomSheetState to collapsed', () => {
      service.selectHotel('hotel-123');
      const state = service.getCurrentState();
      
      expect(state.selectedHotelId).toBe('hotel-123');
      expect(state.bottomSheetState).toBe('collapsed');
    });

    it('should store original viewport when provided', () => {
      const viewport: MapViewport = {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 12,
      };
      
      service.selectHotel('hotel-123', viewport);
      const state = service.getCurrentState();
      
      expect(state.originalMapViewport).toEqual(viewport);
    });

    it('should preserve existing viewport if not provided', () => {
      const viewport: MapViewport = {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 12,
      };
      
      service.selectHotel('hotel-123', viewport);
      service.selectHotel('hotel-456');
      const state = service.getCurrentState();
      
      expect(state.originalMapViewport).toEqual(viewport);
    });

    it('should emit state changes via Observable', (done) => {
      service.getState().subscribe((state) => {
        if (state.selectedHotelId === 'hotel-123') {
          expect(state.selectedHotelId).toBe('hotel-123');
          expect(state.bottomSheetState).toBe('collapsed');
          done();
        }
      });
      
      service.selectHotel('hotel-123');
    });
  });

  describe('dismissSelection', () => {
    it('should reset state to initial values', () => {
      const viewport: MapViewport = {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 12,
      };
      
      service.selectHotel('hotel-123', viewport);
      service.setDragging(true);
      service.setAnimating(true);
      
      service.dismissSelection();
      const state = service.getCurrentState();
      
      expect(state.selectedHotelId).toBeNull();
      expect(state.bottomSheetState).toBe('dismissed');
      expect(state.originalMapViewport).toBeNull();
      expect(state.isAnimating).toBe(false);
      expect(state.isDragging).toBe(false);
    });

    it('should clear viewport on dismissal', () => {
      const viewport: MapViewport = {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 12,
      };
      
      service.selectHotel('hotel-123', viewport);
      service.dismissSelection();
      
      expect(service.getCurrentState().originalMapViewport).toBeNull();
    });
  });

  describe('setBottomSheetState', () => {
    it('should update bottom sheet state', () => {
      service.setBottomSheetState('expanded');
      expect(service.getCurrentState().bottomSheetState).toBe('expanded');
      
      service.setBottomSheetState('collapsed');
      expect(service.getCurrentState().bottomSheetState).toBe('collapsed');
      
      service.setBottomSheetState('dismissed');
      expect(service.getCurrentState().bottomSheetState).toBe('dismissed');
    });

    it('should preserve other state properties', () => {
      service.selectHotel('hotel-123');
      service.setBottomSheetState('expanded');
      
      const state = service.getCurrentState();
      expect(state.selectedHotelId).toBe('hotel-123');
      expect(state.bottomSheetState).toBe('expanded');
    });
  });

  describe('setDragging', () => {
    it('should update dragging state', () => {
      service.setDragging(true);
      expect(service.getCurrentState().isDragging).toBe(true);
      
      service.setDragging(false);
      expect(service.getCurrentState().isDragging).toBe(false);
    });

    it('should preserve other state properties', () => {
      service.selectHotel('hotel-123');
      service.setDragging(true);
      
      const state = service.getCurrentState();
      expect(state.selectedHotelId).toBe('hotel-123');
      expect(state.isDragging).toBe(true);
    });
  });

  describe('setAnimating', () => {
    it('should update animating state', () => {
      service.setAnimating(true);
      expect(service.getCurrentState().isAnimating).toBe(true);
      
      service.setAnimating(false);
      expect(service.getCurrentState().isAnimating).toBe(false);
    });
  });

  describe('setOriginalViewport', () => {
    it('should store viewport', () => {
      const viewport: MapViewport = {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 12,
      };
      
      service.setOriginalViewport(viewport);
      expect(service.getCurrentState().originalMapViewport).toEqual(viewport);
    });

    it('should update viewport if called multiple times', () => {
      const viewport1: MapViewport = {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 12,
      };
      const viewport2: MapViewport = {
        center: { lat: 34.0522, lng: -118.2437 },
        zoom: 10,
      };
      
      service.setOriginalViewport(viewport1);
      service.setOriginalViewport(viewport2);
      
      expect(service.getCurrentState().originalMapViewport).toEqual(viewport2);
    });
  });

  describe('State Transitions', () => {
    it('should handle complete selection to dismissal cycle', () => {
      const viewport: MapViewport = {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 12,
      };
      
      // Initial state
      let state = service.getCurrentState();
      expect(state.selectedHotelId).toBeNull();
      expect(state.bottomSheetState).toBe('dismissed');
      
      // Select hotel
      service.selectHotel('hotel-123', viewport);
      state = service.getCurrentState();
      expect(state.selectedHotelId).toBe('hotel-123');
      expect(state.bottomSheetState).toBe('collapsed');
      expect(state.originalMapViewport).toEqual(viewport);
      
      // Expand sheet
      service.setBottomSheetState('expanded');
      state = service.getCurrentState();
      expect(state.bottomSheetState).toBe('expanded');
      
      // Dismiss
      service.dismissSelection();
      state = service.getCurrentState();
      expect(state.selectedHotelId).toBeNull();
      expect(state.bottomSheetState).toBe('dismissed');
      expect(state.originalMapViewport).toBeNull();
    });

    it('should handle rapid state changes', () => {
      service.selectHotel('hotel-1');
      service.selectHotel('hotel-2');
      service.selectHotel('hotel-3');
      
      const state = service.getCurrentState();
      expect(state.selectedHotelId).toBe('hotel-3');
    });
  });

  describe('Observable State', () => {
    it('should emit state changes to all subscribers', (done) => {
      let emissionCount = 0;
      const expectedStates = ['hotel-1', 'hotel-2', 'hotel-3'];
      
      service.getState().subscribe((state) => {
        if (state.selectedHotelId) {
          expect(state.selectedHotelId).toBe(expectedStates[emissionCount]);
          emissionCount++;
          
          if (emissionCount === 3) {
            done();
          }
        }
      });
      
      service.selectHotel('hotel-1');
      service.selectHotel('hotel-2');
      service.selectHotel('hotel-3');
    });
  });
});
