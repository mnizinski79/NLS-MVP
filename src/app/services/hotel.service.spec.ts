import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HotelService } from './hotel.service';
import { Hotel, SearchCriteria } from '../models';

describe('HotelService', () => {
  let service: HotelService;
  let httpMock: HttpTestingController;

  const mockHotels: Hotel[] = [
    {
      id: '1',
      name: 'Kimpton Hotel A',
      brand: 'Kimpton',
      rating: 4.5,
      location: {
        address: '123 Main St',
        neighborhood: 'Times Square',
        coordinates: { lat: 40.7589, lng: -73.9851 }
      },
      pricing: {
        nightlyRate: 300,
        roomRate: 350,
        fees: 50
      },
      amenities: ['Rooftop Bar', 'Fitness Center'],
      description: 'Luxury hotel',
      imageUrls: ['image1.jpg'],
      phone: '123-456-7890',
      sentiment: ['Times Square', 'Modern']
    },
    {
      id: '2',
      name: 'voco Hotel B',
      brand: 'voco',
      rating: 4.0,
      location: {
        address: '456 Broadway',
        neighborhood: 'Midtown',
        coordinates: { lat: 40.7580, lng: -73.9855 }
      },
      pricing: {
        nightlyRate: 200,
        roomRate: 240,
        fees: 40
      },
      amenities: ['Pool', 'Restaurant'],
      description: 'Comfortable stay',
      imageUrls: ['image2.jpg'],
      phone: '123-456-7891',
      sentiment: ['Midtown', 'Broadway']
    },
    {
      id: '3',
      name: 'InterContinental Hotel C',
      brand: 'InterContinental',
      rating: 5.0,
      location: {
        address: '789 Park Ave',
        neighborhood: 'Upper East Side',
        coordinates: { lat: 40.7700, lng: -73.9600 }
      },
      pricing: {
        nightlyRate: 500,
        roomRate: 580,
        fees: 80
      },
      amenities: ['Spa', 'Rooftop Bar'],
      description: 'Premium experience',
      imageUrls: ['image3.jpg'],
      phone: '123-456-7892',
      sentiment: ['Upper East Side', 'Luxury']
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HotelService]
    });
    service = TestBed.inject(HotelService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('loadHotels', () => {
    it('should load hotels from JSON file', (done: any) => {
      const rawData = [
        {
          id: '1',
          name: 'Test Hotel',
          brandId: 'kimpton',
          rating: 4.5,
          location: { lat: 40.7589, lng: -73.9851, address: '123 Main St' },
          price: { nightlyRate: 300, amount: 350, currency: 'USD' },
          amenities: ['Rooftop Bar'],
          description: 'Test',
          imageUrls: ['image.jpg'],
          phoneNumber: '123-456-7890',
          sentiment: ['Times Square']
        }
      ];

      service.loadHotels().subscribe(hotels => {
        expect(hotels).toBeDefined();
        expect(hotels.length).toBe(1);
        expect(hotels[0].brand).toBe('Kimpton');
        expect(hotels[0].pricing.nightlyRate).toBe(300);
        done();
      });

      const req = httpMock.expectOne('/hotels (1).json');
      expect(req.request.method).toBe('GET');
      req.flush(rawData);
    });

    it('should cache hotels after first load', (done: any) => {
      const rawData = [
        {
          id: '1',
          name: 'Test Hotel',
          brandId: 'kimpton',
          rating: 4.5,
          location: { lat: 40.7589, lng: -73.9851, address: '123 Main St' },
          price: { nightlyRate: 300, amount: 350, currency: 'USD' },
          amenities: [],
          description: 'Test',
          imageUrls: [],
          phoneNumber: '123-456-7890',
          sentiment: []
        }
      ];

      // First load
      service.loadHotels().subscribe(() => {
        // Second load should use cache
        service.loadHotels().subscribe(hotels => {
          expect(hotels.length).toBe(1);
          done();
        });
      });

      const req = httpMock.expectOne('/hotels (1).json');
      req.flush(rawData);
    });

    it('should handle loading errors', (done: any) => {
      service.loadHotels().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Failed to load hotel data');
          done();
        }
      });

      const req = httpMock.expectOne('/hotels (1).json');
      req.error(new ProgressEvent('error'));
    });
  });

  describe('filterByBrand', () => {
    it('should filter hotels by brand', () => {
      const result = service.filterByBrand(mockHotels, ['Kimpton']);
      expect(result.length).toBe(1);
      expect(result[0].brand).toBe('Kimpton');
    });

    it('should filter by multiple brands', () => {
      const result = service.filterByBrand(mockHotels, ['Kimpton', 'voco']);
      expect(result.length).toBe(2);
    });

    it('should return all hotels when brands array is empty', () => {
      const result = service.filterByBrand(mockHotels, []);
      expect(result.length).toBe(3);
    });

    it('should return empty array when no matches', () => {
      const result = service.filterByBrand(mockHotels, ['Holiday Inn']);
      expect(result.length).toBe(0);
    });
  });

  describe('filterBySentiment', () => {
    it('should filter hotels by sentiment with OR logic', () => {
      const result = service.filterBySentiment(mockHotels, ['Times Square']);
      expect(result.length).toBe(1);
      expect(result[0].sentiment).toContain('Times Square');
    });

    it('should match hotels with ANY of the specified sentiments', () => {
      const result = service.filterBySentiment(mockHotels, ['Times Square', 'Midtown']);
      expect(result.length).toBe(2);
    });

    it('should return all hotels when sentiments array is empty', () => {
      const result = service.filterBySentiment(mockHotels, []);
      expect(result.length).toBe(3);
    });

    it('should return empty array when no matches', () => {
      const result = service.filterBySentiment(mockHotels, ['Downtown']);
      expect(result.length).toBe(0);
    });
  });

  describe('filterByAmenities', () => {
    it('should filter hotels by amenities with OR logic', () => {
      const result = service.filterByAmenities(mockHotels, ['Rooftop Bar']);
      expect(result.length).toBe(2);
    });

    it('should match hotels with ANY of the specified amenities', () => {
      const result = service.filterByAmenities(mockHotels, ['Pool', 'Spa']);
      expect(result.length).toBe(2);
    });

    it('should return all hotels when amenities array is empty', () => {
      const result = service.filterByAmenities(mockHotels, []);
      expect(result.length).toBe(3);
    });

    it('should return empty array when no matches', () => {
      const result = service.filterByAmenities(mockHotels, ['Casino']);
      expect(result.length).toBe(0);
    });
  });

  describe('filterByPrice', () => {
    it('should filter hotels by minimum price', () => {
      const result = service.filterByPrice(mockHotels, 250);
      expect(result.length).toBe(2);
      expect(result.every(h => h.pricing.nightlyRate >= 250)).toBe(true);
    });

    it('should filter hotels by maximum price', () => {
      const result = service.filterByPrice(mockHotels, undefined, 300);
      expect(result.length).toBe(2);
      expect(result.every(h => h.pricing.nightlyRate <= 300)).toBe(true);
    });

    it('should filter hotels by price range', () => {
      const result = service.filterByPrice(mockHotels, 200, 400);
      expect(result.length).toBe(2);
      expect(result.every(h => h.pricing.nightlyRate >= 200 && h.pricing.nightlyRate <= 400)).toBe(true);
    });

    it('should return all hotels when no bounds specified', () => {
      const result = service.filterByPrice(mockHotels);
      expect(result.length).toBe(3);
    });

    it('should return empty array when no hotels in range', () => {
      const result = service.filterByPrice(mockHotels, 1000, 2000);
      expect(result.length).toBe(0);
    });
  });

  describe('filterByRating', () => {
    it('should filter hotels by minimum rating', () => {
      const result = service.filterByRating(mockHotels, 4.5);
      expect(result.length).toBe(2);
      expect(result.every(h => h.rating >= 4.5)).toBe(true);
    });

    it('should return all hotels when rating is undefined', () => {
      const result = service.filterByRating(mockHotels, undefined as any);
      expect(result.length).toBe(3);
    });

    it('should return empty array when no hotels meet rating', () => {
      const result = service.filterByRating(mockHotels, 5.5);
      expect(result.length).toBe(0);
    });
  });

  describe('sortHotels', () => {
    it('should sort hotels by price ascending', () => {
      const result = service.sortHotels(mockHotels, 'price_asc');
      expect(result[0].pricing.nightlyRate).toBe(200);
      expect(result[1].pricing.nightlyRate).toBe(300);
      expect(result[2].pricing.nightlyRate).toBe(500);
    });

    it('should sort hotels by price descending', () => {
      const result = service.sortHotels(mockHotels, 'price_desc');
      expect(result[0].pricing.nightlyRate).toBe(500);
      expect(result[1].pricing.nightlyRate).toBe(300);
      expect(result[2].pricing.nightlyRate).toBe(200);
    });

    it('should sort hotels by rating descending', () => {
      const result = service.sortHotels(mockHotels, 'rating_desc');
      expect(result[0].rating).toBe(5.0);
      expect(result[1].rating).toBe(4.5);
      expect(result[2].rating).toBe(4.0);
    });

    it('should not mutate original array', () => {
      const original = [...mockHotels];
      service.sortHotels(mockHotels, 'price_asc');
      expect(mockHotels).toEqual(original);
    });
  });

  describe('filterHotels - pipeline', () => {
    it('should apply filters in correct order', () => {
      const criteria: SearchCriteria = {
        brands: ['Kimpton', 'voco', 'InterContinental'],
        sentiments: ['Times Square', 'Midtown', 'Upper East Side'],
        priceRange: { min: 200, max: 400 },
        amenities: ['Rooftop Bar'],
        minRating: 4.0,
        sortBy: 'price_asc'
      };

      const result = service.filterHotels(mockHotels, criteria);
      expect(result.length).toBe(1);
      expect(result[0].brand).toBe('Kimpton');
    });

    it('should handle empty criteria', () => {
      const result = service.filterHotels(mockHotels, {});
      expect(result.length).toBe(3);
    });

    it('should apply only specified filters', () => {
      const criteria: SearchCriteria = {
        brands: ['Kimpton', 'voco']
      };

      const result = service.filterHotels(mockHotels, criteria);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no hotels match all criteria', () => {
      const criteria: SearchCriteria = {
        brands: ['Kimpton'],
        amenities: ['Pool']
      };

      const result = service.filterHotels(mockHotels, criteria);
      expect(result.length).toBe(0);
    });

    it('should apply sort after all filters', () => {
      const criteria: SearchCriteria = {
        minRating: 4.0,
        sortBy: 'price_desc'
      };

      const result = service.filterHotels(mockHotels, criteria);
      expect(result.length).toBe(3);
      expect(result[0].pricing.nightlyRate).toBe(500);
      expect(result[2].pricing.nightlyRate).toBe(200);
    });
  });

  describe('getHotelById', () => {
    it('should return hotel by id', (done: any) => {
      const rawData = [
        {
          id: 'TEST1',
          name: 'Test Hotel',
          brandId: 'kimpton',
          rating: 4.5,
          location: { lat: 40.7589, lng: -73.9851, address: '123 Main St' },
          price: { nightlyRate: 300, amount: 350, currency: 'USD' },
          amenities: [],
          description: 'Test',
          imageUrls: [],
          phoneNumber: '123-456-7890',
          sentiment: []
        }
      ];

      service.getHotelById('TEST1').subscribe(hotel => {
        expect(hotel).toBeDefined();
        expect(hotel?.id).toBe('TEST1');
        done();
      });

      const req = httpMock.expectOne('/hotels (1).json');
      req.flush(rawData);
    });

    it('should return undefined for non-existent id', (done: any) => {
      const rawData = [
        {
          id: 'TEST1',
          name: 'Test Hotel',
          brandId: 'kimpton',
          rating: 4.5,
          location: { lat: 40.7589, lng: -73.9851, address: '123 Main St' },
          price: { nightlyRate: 300, amount: 350, currency: 'USD' },
          amenities: [],
          description: 'Test',
          imageUrls: [],
          phoneNumber: '123-456-7890',
          sentiment: []
        }
      ];

      service.getHotelById('NONEXISTENT').subscribe(hotel => {
        expect(hotel).toBeUndefined();
        done();
      });

      const req = httpMock.expectOne('/hotels (1).json');
      req.flush(rawData);
    });
  });
});
