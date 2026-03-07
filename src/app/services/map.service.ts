import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Hotel } from '../models/hotel.model';
import { BRAND_COLORS, BRAND_LOGOS } from '../models/brand-config';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  /**
   * Creates a custom Leaflet marker for a hotel with brand styling
   * @param hotel - The hotel to create a marker for
   * @param onClick - Callback function when marker is clicked
   * @param isMobile - Whether to create a smaller marker for mobile
   * @returns Leaflet marker instance
   */
  createCustomMarker(
    hotel: Hotel,
    onClick: (hotel: Hotel) => void,
    isMobile: boolean = false
  ): L.Marker {
    const markerHtml = this.getMarkerHtml(hotel, isMobile);
    
    // Smaller markers with less padding
    const iconSize: [number, number] = isMobile ? [80, 28] : [100, 34];
    const iconAnchor: [number, number] = isMobile ? [40, 28] : [50, 34];
    
    const customIcon = L.divIcon({
      html: markerHtml,
      className: 'custom-hotel-marker',
      iconSize: iconSize,
      iconAnchor: iconAnchor
    });

    const marker = L.marker(
      [hotel.location.coordinates.lat, hotel.location.coordinates.lng],
      { icon: customIcon }
    );

    // Attach click handler
    marker.on('click', () => onClick(hotel));

    return marker;
  }

  /**
   * Generates HTML string for custom marker with brand chiclet, logo, and price
   * @param hotel - The hotel to generate marker HTML for
   * @param isMobile - Whether to generate smaller marker for mobile
   * @returns HTML string for marker
   */
  getMarkerHtml(hotel: Hotel, isMobile: boolean = false): string {
      const brandColor = BRAND_COLORS[hotel.brand] || '#000000';
      const brandLogo = BRAND_LOGOS[hotel.brand] || '';
      const price = Math.round(hotel.pricing.nightlyRate);

      // Smaller dimensions and less padding for mobile
      const padding = isMobile ? '3px 6px' : '4px 8px';
      const borderRadius = isMobile ? '6px' : '8px';
      const logoSize = isMobile ? '22px' : '26px';
      const logoContainerSize = isMobile ? '26px' : '30px';
      const marginRight = isMobile ? '5px' : '6px';
      const fontSize = isMobile ? '12px' : '14px';

      return `
        <div class="marker-content" style="
          display: flex;
          align-items: center;
          background-color: ${brandColor};
          border-radius: ${borderRadius};
          padding: ${padding};
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        " 
        role="button"
        tabindex="0"
        aria-label="${hotel.name}, ${hotel.brand}, ${price} per night"
        onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.4)';"
        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.3)';">
          <div style="
            width: ${logoContainerSize};
            height: ${logoContainerSize};
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: ${marginRight};
          ">
            <img src="${brandLogo}" alt="" aria-hidden="true" style="width: ${logoSize}; height: ${logoSize}; object-fit: contain;" />
          </div>
          <span style="
            color: white;
            font-weight: 600;
            font-size: ${fontSize};
            white-space: nowrap;
          " aria-hidden="true">${price}</span>
        </div>
      `;
    }

  /**
   * Calculates the bounding box for a set of hotels
   * @param hotels - Array of hotels to calculate bounds for
   * @returns Leaflet LatLngBounds object
   */
  calculateBounds(hotels: Hotel[]): L.LatLngBounds | null {
    if (!hotels || hotels.length === 0) {
      return null;
    }

    const coordinates = hotels.map(h => 
      [h.location.coordinates.lat, h.location.coordinates.lng] as [number, number]
    );

    return L.latLngBounds(coordinates);
  }

  /**
   * Returns default Leaflet map configuration options
   * @returns Leaflet MapOptions object
   */
  getDefaultMapOptions(): L.MapOptions {
    return {
      center: [40.7580, -73.9855], // NYC center (Times Square)
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true
    };
  }
}
