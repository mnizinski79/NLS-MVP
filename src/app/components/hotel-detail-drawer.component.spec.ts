import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotelDetailDrawerComponent } from './hotel-detail-drawer.component';
import { Hotel } from '../models/hotel.model';

describe('HotelDetailDrawerComponent', () => {
  let component: HotelDetailDrawerComponent;
  let fixture: ComponentFixture<HotelDetailDrawerComponent>;

  const mockHotel: Hotel = {
    id: '1',
    name: 'Test Hotel',
    brand: 'Kimpton',
    rating: 4,
    location: {
      address: '123 Test St',
      neighborhood: 'Test District',
      coordinates: { lat: 40.7589, lng: -73.9851 }
    },
    pricing: {
      nightlyRate: 250,
      roomRate: 220,
      fees: 30
    },
    amenities: ['WiFi', 'Pool', 'Gym'],
    description: 'A test hotel',
    imageUrls: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
    phone: '555-1234',
    sentiment: ['Times Square']
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelDetailDrawerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HotelDetailDrawerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closed event when close is called', () => {
    const emitSpy = jest.spyOn(component.closed, 'emit');
    component.close();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should reset image index when hotel changes', () => {
    component.hotel = mockHotel;
    component.currentImageIndex = 2;
    component.ngOnChanges({
      hotel: {
        currentValue: mockHotel,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true
      }
    });
    expect(component.currentImageIndex).toBe(0);
  });

  it('should navigate to next image', () => {
    component.hotel = mockHotel;
    component.currentImageIndex = 0;
    component.nextImage();
    expect(component.currentImageIndex).toBe(1);
  });

  it('should wrap to first image when at end', () => {
    component.hotel = mockHotel;
    component.currentImageIndex = 2;
    component.nextImage();
    expect(component.currentImageIndex).toBe(0);
  });

  it('should navigate to previous image', () => {
    component.hotel = mockHotel;
    component.currentImageIndex = 1;
    component.previousImage();
    expect(component.currentImageIndex).toBe(0);
  });

  it('should wrap to last image when at beginning', () => {
    component.hotel = mockHotel;
    component.currentImageIndex = 0;
    component.previousImage();
    expect(component.currentImageIndex).toBe(2);
  });

  it('should format price correctly', () => {
    component.hotel = mockHotel;
    expect(component.formatPrice()).toBe('$250/night');
  });

  it('should format price breakdown correctly', () => {
    component.hotel = mockHotel;
    expect(component.getPriceBreakdown()).toBe('Room: $220 + Fees: $30');
  });

  // Backdrop tests removed - backdrop was removed in task 7.1 and 7.2

  it('should close on Escape key when visible', () => {
    component.visible = true;
    const emitSpy = jest.spyOn(component.closed, 'emit');
    const mockEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onEscapeKey(mockEvent);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should not close on Escape key when not visible', () => {
    component.visible = false;
    const emitSpy = jest.spyOn(component.closed, 'emit');
    const mockEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onEscapeKey(mockEvent);
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
