import { TestBed } from '@angular/core/testing';
import { MapService } from './map.service';
import { Hotel } from '../models/hotel.model';
import * as L from 'leaflet';

describe('MapService', () => {
  let service: MapService;

  const mockHotel: Hotel = {
    id: '1',
    name: 'Test Hotel',
    brand: 'Kimpton',
    rating: 4,
    location: {
      address: '123 Test St',
      neighborhood: 'Test Area',
      coordinates: {
        lat: 40.7580,
        lng: -73.9855
      }
    },
    pricing: {
      nightlyRate: 250,
      roomRate: 230,
      fees: 20
    },
    amenities: ['WiFi', 'Pool'],
    description: 'Test hotel description',
    imageUrls: ['test.jpg'],
    phone: '555-1234',
    sentiment: ['Times Square']
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createCustomMarker', () => {
    it('should create a marker with correct coordinates', () => {
      const onClick = jest.fn();
      const marker = service.createCustomMarker(mockHotel, onClick);

      expect(marker).toBeInstanceOf(L.Marker);
      const latLng = marker.getLatLng();
      expect(latLng.lat).toBe(40.7580);
      expect(latLng.lng).toBe(-73.9855);
    });

    it('should call onClick callback when marker is clicked', () => {
      const onClick = jest.fn();
      const marker = service.createCustomMarker(mockHotel, onClick);

      marker.fire('click');

      expect(onClick).toHaveBeenCalledWith(mockHotel);
    });

    it('should create marker with custom icon', () => {
      const onClick = jest.fn();
      const marker = service.createCustomMarker(mockHotel, onClick);

      const icon = marker.getIcon() as L.DivIcon;
      expect(icon).toBeInstanceOf(L.DivIcon);
      expect(icon.options.className).toBe('custom-hotel-marker');
    });
  });

  describe('getMarkerHtml', () => {
    it('should generate HTML with brand color', () => {
      const html = service.getMarkerHtml(mockHotel);

      expect(html).toContain('#000000'); // Kimpton brand color
    });

    it('should include brand logo', () => {
      const html = service.getMarkerHtml(mockHotel);

      expect(html).toContain('assets/logos/kimpton.svg');
      expect(html).toContain('aria-hidden="true"');
    });

    it('should display nightly rate', () => {
      const html = service.getMarkerHtml(mockHotel);

      expect(html).toContain('$250');
    });

    it('should round nightly rate to nearest integer', () => {
      const hotelWithDecimal = { ...mockHotel, pricing: { ...mockHotel.pricing, nightlyRate: 249.99 } };
      const html = service.getMarkerHtml(hotelWithDecimal);

      expect(html).toContain('$250');
    });

    it('should use default color for unknown brand', () => {
      const hotelWithUnknownBrand = { ...mockHotel, brand: 'Unknown' as any };
      const html = service.getMarkerHtml(hotelWithUnknownBrand);

      expect(html).toContain('#000000'); // Default color
    });
  });

  describe('calculateBounds', () => {
    it('should calculate bounds for multiple hotels', () => {
      const hotels: Hotel[] = [
        mockHotel,
        {
          ...mockHotel,
          id: '2',
          location: {
            ...mockHotel.location,
            coordinates: { lat: 40.7500, lng: -73.9800 }
          }
        },
        {
          ...mockHotel,
          id: '3',
          location: {
            ...mockHotel.location,
            coordinates: { lat: 40.7600, lng: -73.9900 }
          }
        }
      ];

      const bounds = service.calculateBounds(hotels);

      expect(bounds).not.toBeNull();
      expect(bounds).toBeInstanceOf(L.LatLngBounds);
      
      // Check that bounds contain all coordinates
      const sw = bounds!.getSouthWest();
      const ne = bounds!.getNorthEast();
      
      expect(sw.lat).toBeLessThanOrEqual(40.7500);
      expect(ne.lat).toBeGreaterThanOrEqual(40.7600);
      expect(sw.lng).toBeLessThanOrEqual(-73.9900);
      expect(ne.lng).toBeGreaterThanOrEqual(-73.9800);
    });

    it('should return null for empty array', () => {
      const bounds = service.calculateBounds([]);

      expect(bounds).toBeNull();
    });

    it('should return null for null input', () => {
      const bounds = service.calculateBounds(null as any);

      expect(bounds).toBeNull();
    });

    it('should handle single hotel', () => {
      const bounds = service.calculateBounds([mockHotel]);

      expect(bounds).not.toBeNull();
      expect(bounds).toBeInstanceOf(L.LatLngBounds);
    });
  });

  describe('getDefaultMapOptions', () => {
    it('should return map options with NYC center', () => {
      const options = service.getDefaultMapOptions();

      expect(options.center).toEqual([40.7580, -73.9855]);
    });

    it('should return map options with zoom level 13', () => {
      const options = service.getDefaultMapOptions();

      expect(options.zoom).toBe(13);
    });

    it('should enable zoom control', () => {
      const options = service.getDefaultMapOptions();

      expect(options.zoomControl).toBe(true);
    });

    it('should enable scroll wheel zoom', () => {
      const options = service.getDefaultMapOptions();

      expect(options.scrollWheelZoom).toBe(true);
    });

    it('should enable dragging', () => {
      const options = service.getDefaultMapOptions();

      expect(options.dragging).toBe(true);
    });
  });
});
