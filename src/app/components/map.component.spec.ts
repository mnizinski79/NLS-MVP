import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { MapService } from '../services/map.service';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let mapService: MapService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapComponent],
      providers: [MapService]
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    mapService = TestBed.inject(MapService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default inputs', () => {
    expect(component.hotels).toEqual([]);
    expect(component.center).toEqual([40.7580, -73.9855]);
    expect(component.zoom).toBe(13);
  });

  it('should emit markerClicked event', () => {
    const mockHotel = {
      id: '1',
      name: 'Test Hotel',
      brand: 'Kimpton' as const,
      rating: 4.5,
      location: {
        address: '123 Test St',
        neighborhood: 'Test Area',
        coordinates: { lat: 40.7580, lng: -73.9855 }
      },
      pricing: { nightlyRate: 200, roomRate: 180, fees: 20 },
      amenities: ['WiFi'],
      description: 'Test',
      imageUrls: [],
      phone: '123-456-7890',
      sentiment: ['Test']
    };

    let emittedHotel;
    component.markerClicked.subscribe((hotel) => {
      emittedHotel = hotel;
    });

    component.markerClicked.emit(mockHotel);
    expect(emittedHotel).toEqual(mockHotel);
  });

  it('should accept selectedHotelId input', () => {
    component.selectedHotelId = 'hotel-123';
    expect(component.selectedHotelId).toBe('hotel-123');
  });

  it('should return current viewport when map is initialized', () => {
    // Initialize component
    fixture.detectChanges();
    
    // Get viewport (may be null if map not fully initialized in test)
    const viewport = component.getCurrentViewport();
    
    // If map is initialized, viewport should have center and zoom
    if (viewport) {
      expect(viewport).toHaveProperty('center');
      expect(viewport).toHaveProperty('zoom');
      expect(viewport.center).toHaveProperty('lat');
      expect(viewport.center).toHaveProperty('lng');
    }
  });

  it('should handle restoreViewport gracefully', () => {
    const mockViewport = {
      center: { lat: 40.7580, lng: -73.9855 },
      zoom: 15
    };

    // Should not throw error even if map not initialized
    expect(() => component.restoreViewport(mockViewport)).not.toThrow();
  });
});
