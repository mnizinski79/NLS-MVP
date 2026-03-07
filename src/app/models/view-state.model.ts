import * as L from 'leaflet';

/**
 * ViewState - Represents the current state of the desktop layout transformation
 *
 * States:
 * - 'default': Normal view with visible cards, default map zoom, expanded chat
 * - 'transforming': Transition in progress (animations running)
 * - 'focused': Hotel detail view with hidden cards, zoomed map, collapsed chat
 */
export type ViewStateMode = 'default' | 'transforming' | 'focused';

/**
 * MapState - Stores map state for restoration after focused view
 */
export interface MapState {
  /** Map center coordinates [lat, lng] */
  center: [number, number];
  
  /** Map zoom level */
  zoom: number;
  
  /** Map bounds (optional, for more precise restoration) */
  bounds: L.LatLngBounds | null;
}

/**
 * ViewState - Complete view state tracking for desktop layout
 */
export interface ViewState {
  /** Current view mode */
  mode: ViewStateMode;
  
  /** Whether animations are currently running */
  isAnimating: boolean;
  
  /** Currently focused hotel (null in default state) */
  focusedHotel: any | null;
  
  /** Previous map state for restoration */
  previousMapState: MapState | null;
}
