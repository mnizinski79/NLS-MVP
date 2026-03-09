import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { Hotel } from '../models/hotel.model';
import { PointOfInterest } from '../models';
import { MapService } from '../services/map.service';

// Simple interface for map viewport
interface MapViewport {
  center: { lat: number; lng: number };
  zoom: number;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #mapContainer class="map-container" style="width: 100%; height: 100%;"></div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    
    .map-container {
      width: 100%;
      height: 100%;
    }
  `]
})
/**
 * MapComponent - Interactive Leaflet map with custom hotel markers
 *
 * Displays an interactive map with custom-styled markers for each hotel.
 * Features:
 * - Custom markers with brand colors, logos, and pricing
 * - Auto-centering on hotel results
 * - Click handling for marker interactions
 * - Dynamic marker updates when hotels change
 *
 * Uses MapService for marker creation and bounds calculation.
 *
 * @example
 * <app-map
 *   [hotels]="filteredHotels"
 *   [center]="[40.7580, -73.9855]"
 *   [zoom]="13"
 *   (markerClicked)="openHotelDetails($event)">
 * </app-map>
 */
export class MapComponent implements OnInit, OnChanges, OnDestroy {
  /** Array of hotels to display as markers */
  @Input() hotels: Hotel[] = [];

  /** Map center coordinates [lat, lng] */
  @Input() center: [number, number] = [40.7580, -73.9855]; // NYC center (Times Square)

  /** Map zoom level */
  @Input() zoom: number = 13;

  /** Whether this is a mobile view (hides zoom controls, shrinks markers) */
  @Input() isMobile: boolean = false;

  /** ID of the currently selected hotel for highlighting */
  @Input() selectedHotelId: string | null = null;

  /** Point of Interest to display on the map */
  @Input() pointOfInterest: PointOfInterest | null = null;

  /** Emitted when a marker is clicked, passes the hotel object */
  @Output() markerClicked = new EventEmitter<Hotel>();

  /** Reference to map container element */
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  /** Leaflet map instance */
  private map: L.Map | null = null;

  /** Array of current markers on the map */
  private markers: L.Marker[] = [];

  /** POI marker on the map */
  private poiMarker: L.Marker | null = null;

  /** Currently focused hotel for zoom/highlight */
  focusedHotel: Hotel | null = null;

  /** Whether map is in expanded state */
  isExpanded: boolean = false;

  /** Previous map state storage for restoration */
  private previousMapState: { center: [number, number], zoom: number, bounds: L.LatLngBounds | null } | null = null;

  constructor(private mapService: MapService) {}

  /**
   * Initialize map on component init
   */
  ngOnInit(): void {
    this.initMap();
    
    // Add POI marker if it exists on init
    if (this.pointOfInterest) {
      console.log('📍 POI exists on init:', this.pointOfInterest);
      setTimeout(() => this.updatePOIMarker(), 100);
    }
  }

  /**
   * Update map when inputs change
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (this.map) {
      if (changes['hotels'] && !changes['hotels'].firstChange) {
        this.updateMarkers();
      }

      if (changes['center'] && !changes['center'].firstChange) {
        this.map.setView(this.center, this.zoom);
      }

      if (changes['zoom'] && !changes['zoom'].firstChange) {
        this.map.setZoom(this.zoom);
      }

      if (changes['selectedHotelId']) {
        this.updatePinHighlight();
      }

      if (changes['pointOfInterest']) {
        console.log('📍 POI changed:', changes['pointOfInterest'].currentValue);
        this.updatePOIMarker();
      }
    }
  }

  /**
   * Clean up map instance on component destroy
   */
  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  /**
   * Initialize Leaflet map with default options and tile layer
   */
  private initMap(): void {
    const mapOptions = this.mapService.getDefaultMapOptions();

    // Override with component inputs
    mapOptions.center = this.center;
    mapOptions.zoom = this.zoom;
    
    // Disable zoom controls on mobile
    if (this.isMobile) {
      mapOptions.zoomControl = false;
    }

    this.map = L.map(this.mapContainer.nativeElement, mapOptions);

    // Add OpenStreetMap tile layer (light style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.map);

    // Initial markers
    if (this.hotels && this.hotels.length > 0) {
      this.updateMarkers();
    }
  }

  /**
   * Clear existing markers and create new markers for current hotels
   * Auto-centers map to fit all markers
   */
  private updateMarkers(): void {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Create new markers for each hotel
    this.hotels.forEach(hotel => {
      const marker = this.mapService.createCustomMarker(
        hotel,
        (clickedHotel) => this.markerClicked.emit(clickedHotel),
        this.isMobile
      );

      marker.addTo(this.map!);
      this.markers.push(marker);
    });

    // Center map on hotels if there are any
    if (this.hotels.length > 0) {
      this.centerOnHotels();
    }
  }

  /**
   * Adjust map bounds to fit all hotel markers with padding
   */
  private centerOnHotels(): void {
    if (!this.map || this.hotels.length === 0) return;

    const bounds = this.mapService.calculateBounds(this.hotels);

    if (bounds) {
      this.map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15
      });
    }
  }

  /**
   * Center map on a specific hotel with vertical offset
   * Positions the hotel pin in the top third of the viewport to account for bottom sheet
   * @param hotelId - ID of the hotel to center on
   * @param offsetY - Vertical offset in pixels (typically screen height / 3)
   * @returns Promise that resolves when operation completes or times out
   */
  centerOnHotel(hotelId: string, offsetY: number = 0): Promise<void> {
    return new Promise((resolve) => {
      // Set timeout for map operation (1000ms)
      const timeout = setTimeout(() => {
        console.warn('Map centering operation timed out after 1000ms');
        resolve(); // Continue with other operations
      }, 1000);

      try {
        if (!this.map) {
          console.warn('Map not initialized, skipping center operation');
          clearTimeout(timeout);
          resolve();
          return;
        }

        const hotel = this.hotels.find(h => h.id === hotelId);
        if (!hotel) {
          console.warn('Hotel not found for centering:', hotelId);
          clearTimeout(timeout);
          resolve();
          return;
        }

        // Validate hotel coordinates
        if (!hotel.location?.coordinates?.lat || !hotel.location?.coordinates?.lng) {
          console.error('Invalid hotel coordinates for hotel:', hotel.name || 'Unknown');
          clearTimeout(timeout);
          resolve();
          return;
        }

        const hotelLat = hotel.location.coordinates.lat;
        const hotelLng = hotel.location.coordinates.lng;

        // Calculate center position with offset
        const centerWithOffset = this.calculateCenterWithOffset(hotelLat, hotelLng, offsetY);

        // Pan to the calculated center
        this.map.setView([centerWithOffset.lat, centerWithOffset.lng], this.map.getZoom(), {
          animate: true,
          duration: 0.35 // 350ms animation
        });

        // Clear timeout and resolve after animation completes
        setTimeout(() => {
          clearTimeout(timeout);
          resolve();
        }, 350);
      } catch (error) {
        // Safely log error without trying to serialize complex objects
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error during map centering:', errorMessage);
        clearTimeout(timeout);
        resolve(); // Continue with other operations
      }
    });
  }

  /**
   * Calculate map center position accounting for vertical offset
   * Converts pixel offset to latitude degrees based on current zoom level
   * @param hotelLat - Hotel latitude
   * @param hotelLng - Hotel longitude
   * @param offsetY - Vertical offset in pixels
   * @returns Adjusted center coordinates
   */
  private calculateCenterWithOffset(
    hotelLat: number,
    hotelLng: number,
    offsetY: number
  ): { lat: number; lng: number } {
    if (!this.map || offsetY === 0) {
      console.log('🗺️ No offset applied - map:', !!this.map, 'offsetY:', offsetY);
      return { lat: hotelLat, lng: hotelLng };
    }

    // Get current zoom level
    const zoom = this.map.getZoom();

    // Calculate degrees per pixel at current zoom level
    // Leaflet uses 256x256 tiles, and at zoom 0, the world is 256 pixels wide
    // At each zoom level, the world doubles in size
    const degreesPerPixel = 360 / (256 * Math.pow(2, zoom));

    // Convert offset pixels to degrees
    const offsetDegrees = offsetY * degreesPerPixel;

    // Calculate new center latitude
    // SUBTRACT offset to move the map center south, making the hotel appear north (higher on screen)
    const newCenterLat = hotelLat - offsetDegrees;

    console.log('🗺️ Map offset calculation:', {
      hotelLat,
      hotelLng,
      offsetY,
      zoom,
      degreesPerPixel,
      offsetDegrees,
      newCenterLat,
      latDiff: newCenterLat - hotelLat
    });

    return { lat: newCenterLat, lng: hotelLng };
  }

  /**
   * Get the current map viewport (center and zoom)
   * @returns Current viewport state or null if map not initialized
   */
  getCurrentViewport(): MapViewport | null {
    if (!this.map) {
      console.warn('Map not initialized, cannot get viewport');
      return null;
    }

    try {
      const center = this.map.getCenter();
      const zoom = this.map.getZoom();

      return {
        center: { lat: center.lat, lng: center.lng },
        zoom: zoom
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting current viewport:', errorMessage);
      return null;
    }
  }

  /**
   * Restore map to a previously saved viewport
   * @param viewport - Viewport state to restore
   * @returns Promise that resolves when operation completes or times out
   */
  restoreViewport(viewport: MapViewport): Promise<void> {
    return new Promise((resolve) => {
      // Set timeout for map operation (1000ms)
      const timeout = setTimeout(() => {
        console.warn('Map viewport restoration timed out after 1000ms');
        resolve(); // Continue with other operations
      }, 1000);

      try {
        if (!this.map) {
          console.warn('Map not initialized, cannot restore viewport');
          clearTimeout(timeout);
          resolve();
          return;
        }

        if (!viewport) {
          console.warn('No viewport provided for restoration');
          clearTimeout(timeout);
          resolve();
          return;
        }

        this.map.setView(
          [viewport.center.lat, viewport.center.lng],
          viewport.zoom,
          {
            animate: true,
            duration: 0.35 // 350ms animation
          }
        );

        // Clear timeout and resolve after animation completes
        setTimeout(() => {
          clearTimeout(timeout);
          resolve();
        }, 350);
      } catch (error) {
        // Safely log error without trying to serialize complex objects
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error restoring viewport:', errorMessage);
        clearTimeout(timeout);
        resolve(); // Continue with other operations
      }
    });
  }


  /**
   * Expand map and zoom to specific hotel location
   * Uses Leaflet's flyTo() for smooth animation
   * @param hotel - Hotel to zoom to
   * @returns Promise that resolves after animation completes (350ms)
   */
  expandAndZoomToHotel(hotel: Hotel): Promise<void> {
    if (!this.map) {
      console.warn('Map not initialized, skipping zoom animation');
      return Promise.resolve();
    }

    // Validate hotel coordinates
    if (!hotel.location?.coordinates?.lat || !hotel.location?.coordinates?.lng) {
      console.error('Invalid hotel coordinates for hotel:', hotel.name || 'Unknown', hotel);
      
      // Fall back to default map center if coordinates are missing
      const defaultCenter: [number, number] = [40.7580, -73.9855]; // NYC default
      const targetZoom = 15.5;
      
      return new Promise((resolve) => {
        try {
          this.map!.flyTo(defaultCenter, targetZoom, {
            duration: 0.35,
            easeLinearity: 0.25
          });
          
          console.warn('Falling back to default map center due to invalid coordinates');
          setTimeout(resolve, 350);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Error during fallback map zoom:', errorMessage);
          resolve(); // Continue with other animations
        }
      });
    }

    // Store current map state before zooming
    try {
      if (!this.previousMapState) {
        this.previousMapState = {
          center: [this.map.getCenter().lat, this.map.getCenter().lng],
          zoom: this.map.getZoom(),
          bounds: this.map.getBounds()
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error storing previous map state:', errorMessage);
      // Continue without storing state
    }

    this.focusedHotel = hotel;
    this.isExpanded = true;

    const targetZoom = 15.5;
    const hotelLat = hotel.location.coordinates.lat;
    const hotelLng = hotel.location.coordinates.lng;

    return new Promise((resolve) => {
      try {
        // Center the pin at the exact center of the screen (50/50)
        const targetCenter: [number, number] = [hotelLat, hotelLng];

        // Use Leaflet's flyTo for smooth zoom/pan animation
        this.map!.flyTo(targetCenter, targetZoom, {
          duration: 0.35, // 350ms
          easeLinearity: 0.25 // ease-out effect
        });

        // Clear any previous highlights before highlighting the new marker
        this.clearHighlight();
        
        // Highlight the hotel marker
        this.highlightMarker(hotel);

        // Resolve after animation completes
        setTimeout(resolve, 350);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error during map zoom animation:', errorMessage);
        // Display error message to user (could be enhanced with a toast/notification)
        console.warn('Map zoom failed, but continuing with other animations');
        resolve(); // Continue with other animations
      }
    });
  }

  /**
   * Restore map to original view state
   * Returns map to the state before expandAndZoomToHotel was called
   * @returns Promise that resolves after animation completes (350ms)
   */
  restoreOriginalView(): Promise<void> {
    if (!this.map) {
      console.warn('Map not initialized, skipping restore animation');
      return Promise.resolve();
    }
    
    if (!this.previousMapState) {
      console.warn('No previous map state to restore');
      return Promise.resolve();
    }

    this.focusedHotel = null;
    this.isExpanded = false;

    // Clear marker highlights
    try {
      this.clearHighlight();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error clearing marker highlights:', errorMessage);
      // Continue with restoration
    }

    const { center, zoom } = this.previousMapState;

    return new Promise((resolve) => {
      try {
        // Use flyTo to smoothly return to original state
        this.map!.flyTo(center, zoom, {
          duration: 0.35, // 350ms
          easeLinearity: 0.25 // ease-out effect
        });

        // Clear stored state after restoration
        setTimeout(() => {
          this.previousMapState = null;
          resolve();
        }, 350);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error during map restore animation:', errorMessage);
        console.warn('Map restore failed, but continuing with other animations');
        this.previousMapState = null;
        resolve(); // Continue with other animations
      }
    });
  }


    /**
     * Update pin highlighting based on selectedHotelId input
     * Clears previous highlights and applies highlight to the selected hotel
     */
    private updatePinHighlight(): void {
      if (!this.map) {
        return;
      }

      // Clear all existing highlights
      this.clearHighlight();

      // Apply highlight to selected hotel if one is selected
      if (this.selectedHotelId) {
        const hotel = this.hotels.find(h => h.id === this.selectedHotelId);
        if (hotel) {
          this.highlightMarker(hotel);
        }
      }
    }

    /**
     * Highlight a specific hotel marker
     * Applies a custom CSS class to make the marker stand out
     * @param hotel - Hotel whose marker should be highlighted
     */
    highlightMarker(hotel: Hotel): void {
      if (!this.map) {
        console.warn('Map not initialized, skipping marker highlight');
        return;
      }

      try {
        // Find the marker for this hotel
        const markerIndex = this.hotels.findIndex(h => h.id === hotel.id);
        if (markerIndex === -1 || !this.markers[markerIndex]) {
          console.warn('Marker not found for hotel:', hotel.name || 'Unknown');
          return;
        }

        const marker = this.markers[markerIndex];
        const markerElement = marker.getElement();

        if (markerElement) {
          markerElement.classList.add('highlighted-marker');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error highlighting marker:', errorMessage);
        // Continue without highlighting
      }
    }

    /**
     * Clear all marker highlights
     * Removes the highlight CSS class from all markers
     */
    clearHighlight(): void {
      try {
        this.markers.forEach(marker => {
          const markerElement = marker.getElement();
          if (markerElement) {
            markerElement.classList.remove('highlighted-marker');
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error clearing marker highlights:', errorMessage);
        // Continue without clearing highlights
      }
    }

    /**
     * Update POI marker on the map
     * Creates or removes POI marker based on pointOfInterest input
     */
    private updatePOIMarker(): void {
      if (!this.map) return;

      // Remove existing POI marker
      if (this.poiMarker) {
        this.poiMarker.remove();
        this.poiMarker = null;
      }

      // Create new POI marker if POI exists
      if (this.pointOfInterest) {
        this.poiMarker = this.createPOIMarker(this.pointOfInterest);
        this.poiMarker.addTo(this.map);
        
        console.log('📍 POI marker added to map:', this.pointOfInterest.name);
      }
    }

    /**
     * Create a custom POI marker
     * Uses a star icon to distinguish from hotel markers
     * @param poi - Point of Interest to create marker for
     * @returns Leaflet marker for the POI
     */
    private createPOIMarker(poi: PointOfInterest): L.Marker {
      const icon = L.divIcon({
        className: 'poi-marker',
        html: `
          <div class="poi-marker-content">
            <div class="poi-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#C7370F" stroke="white" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="poi-label">${poi.name}</div>
          </div>
        `,
        iconSize: [120, 60],
        iconAnchor: [60, 30]
      });

      return L.marker([poi.coordinates.lat, poi.coordinates.lng], { icon });
    }

}
