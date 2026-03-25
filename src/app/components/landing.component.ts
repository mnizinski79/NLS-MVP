import { Component, Input, Output, EventEmitter, OnDestroy, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from './input.component';
import { NgxThreeGlobeComponent } from '@omnedia/ngx-three-globe';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, InputComponent, NgxThreeGlobeComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  @Input() visible: boolean = true;
  @Output() dismissed = new EventEmitter<void>();
  @Output() messageSent = new EventEmitter<string>();

  exampleQueries: string[] = [
    'Show me luxury hotels in Midtown',
    'Find pet-friendly hotels with a rooftop bar'
  ];

  /** Globe configuration — ghostly/ambient style */
  globeConfig: any = {
    pointSize: 0.4,
    globeColor: '#f0f2f4',
    showAtmosphere: true,
    atmosphereColor: '#e8eaed',
    atmosphereAltitude: 0.12,
    emissive: '#ffffff',
    emissiveIntensity: 0.6,
    shininess: 0.02,
    polygonColor: 'rgba(150, 160, 170, 0.25)',
    ambientLight: '#ffffff',
    directionalLeftLight: '#ffffff',
    directionalTopLight: '#ffffff',
    pointLight: '#ffffff',
    arcTime: 0,
    arcLength: 0,
    rings: 0,
    maxRings: 0,
    autoRotate: true,
    autoRotateSpeed: 0.3,
    initialPosition: { lat: 20, lng: 0 },
    extraPoints: [
      // Africa
      { lat: -8.84, lng: 13.23, color: 'rgba(31,68,86,0.35)' },    // Angola
      { lat: 30.04, lng: 31.24, color: 'rgba(31,68,86,0.35)' },    // Egypt
      { lat: -20.16, lng: 57.50, color: 'rgba(31,68,86,0.35)' },   // Mauritius
      { lat: -33.93, lng: 18.42, color: 'rgba(31,68,86,0.35)' },   // South Africa
      { lat: -15.39, lng: 28.32, color: 'rgba(31,68,86,0.35)' },   // Zambia
      // Asia
      { lat: 23.81, lng: 90.41, color: 'rgba(31,68,86,0.35)' },    // Bangladesh
      { lat: 22.32, lng: 114.17, color: 'rgba(31,68,86,0.35)' },   // Hong Kong
      { lat: 19.08, lng: 72.88, color: 'rgba(31,68,86,0.35)' },    // India
      { lat: -6.21, lng: 106.85, color: 'rgba(31,68,86,0.35)' },   // Indonesia
      { lat: 35.68, lng: 139.69, color: 'rgba(31,68,86,0.35)' },   // Japan
      { lat: 37.57, lng: 126.98, color: 'rgba(31,68,86,0.35)' },   // South Korea
      { lat: 22.20, lng: 113.55, color: 'rgba(31,68,86,0.35)' },   // Macao
      { lat: 31.23, lng: 121.47, color: 'rgba(31,68,86,0.35)' },   // China
      { lat: 3.14, lng: 101.69, color: 'rgba(31,68,86,0.35)' },    // Malaysia
      { lat: 4.18, lng: 73.51, color: 'rgba(31,68,86,0.35)' },     // Maldives
      { lat: 27.70, lng: 85.32, color: 'rgba(31,68,86,0.35)' },    // Nepal
      { lat: 1.35, lng: 103.82, color: 'rgba(31,68,86,0.35)' },    // Singapore
      { lat: 25.03, lng: 121.57, color: 'rgba(31,68,86,0.35)' },   // Taiwan
      { lat: 13.75, lng: 100.52, color: 'rgba(31,68,86,0.35)' },   // Thailand
      { lat: 21.03, lng: 105.85, color: 'rgba(31,68,86,0.35)' },   // Vietnam
      // Oceania
      { lat: -33.87, lng: 151.21, color: 'rgba(31,68,86,0.35)' },  // Australia
      { lat: -18.14, lng: 178.44, color: 'rgba(31,68,86,0.35)' },  // Fiji
      { lat: -17.54, lng: -149.57, color: 'rgba(31,68,86,0.35)' }, // French Polynesia
      { lat: -36.85, lng: 174.76, color: 'rgba(31,68,86,0.35)' },  // New Zealand
      // Europe
      { lat: 48.21, lng: 16.37, color: 'rgba(31,68,86,0.35)' },    // Austria
      { lat: 40.41, lng: 49.87, color: 'rgba(31,68,86,0.35)' },    // Azerbaijan
      { lat: 42.70, lng: 23.32, color: 'rgba(31,68,86,0.35)' },    // Bulgaria
      { lat: 48.86, lng: 2.35, color: 'rgba(31,68,86,0.35)' },     // France
      { lat: 52.52, lng: 13.41, color: 'rgba(31,68,86,0.35)' },    // Germany
      { lat: 37.98, lng: 23.73, color: 'rgba(31,68,86,0.35)' },    // Greece
      { lat: 47.50, lng: 19.04, color: 'rgba(31,68,86,0.35)' },    // Hungary
      { lat: 53.35, lng: -6.26, color: 'rgba(31,68,86,0.35)' },    // Ireland
      { lat: 32.08, lng: 34.78, color: 'rgba(31,68,86,0.35)' },    // Israel
      { lat: 41.90, lng: 12.50, color: 'rgba(31,68,86,0.35)' },    // Italy
      { lat: 43.24, lng: 76.95, color: 'rgba(31,68,86,0.35)' },    // Kazakhstan
      { lat: 35.90, lng: 14.51, color: 'rgba(31,68,86,0.35)' },    // Malta
      { lat: 52.37, lng: 4.90, color: 'rgba(31,68,86,0.35)' },     // Netherlands
      { lat: 52.23, lng: 21.01, color: 'rgba(31,68,86,0.35)' },    // Poland
      { lat: 38.72, lng: -9.14, color: 'rgba(31,68,86,0.35)' },    // Portugal
      { lat: 44.43, lng: 26.10, color: 'rgba(31,68,86,0.35)' },    // Romania
      { lat: 46.05, lng: 14.51, color: 'rgba(31,68,86,0.35)' },    // Slovenia
      { lat: 40.42, lng: -3.70, color: 'rgba(31,68,86,0.35)' },    // Spain
      { lat: 41.01, lng: 28.98, color: 'rgba(31,68,86,0.35)' },    // Turkey
      { lat: 50.45, lng: 30.52, color: 'rgba(31,68,86,0.35)' },    // Ukraine
      { lat: 51.51, lng: -0.13, color: 'rgba(31,68,86,0.35)' },    // UK
      { lat: 41.31, lng: 69.28, color: 'rgba(31,68,86,0.35)' },    // Uzbekistan
      // Central America & Caribbean
      { lat: 9.93, lng: -84.09, color: 'rgba(31,68,86,0.35)' },    // Costa Rica
      { lat: 15.30, lng: -61.39, color: 'rgba(31,68,86,0.35)' },   // Dominica
      { lat: 18.49, lng: -69.93, color: 'rgba(31,68,86,0.35)' },   // Dominican Republic
      { lat: 13.69, lng: -89.19, color: 'rgba(31,68,86,0.35)' },   // El Salvador
      { lat: 12.05, lng: -61.75, color: 'rgba(31,68,86,0.35)' },   // Grenada
      { lat: 14.63, lng: -90.51, color: 'rgba(31,68,86,0.35)' },   // Guatemala
      { lat: 14.08, lng: -87.21, color: 'rgba(31,68,86,0.35)' },   // Honduras
      { lat: 19.43, lng: -99.13, color: 'rgba(31,68,86,0.35)' },   // Mexico
      { lat: 12.15, lng: -86.27, color: 'rgba(31,68,86,0.35)' },   // Nicaragua
      { lat: 9.00, lng: -79.52, color: 'rgba(31,68,86,0.35)' },    // Panama
      // Middle East
      { lat: 31.95, lng: 35.93, color: 'rgba(31,68,86,0.35)' },    // Jordan
      { lat: 33.89, lng: 35.50, color: 'rgba(31,68,86,0.35)' },    // Lebanon
      { lat: 23.59, lng: 58.38, color: 'rgba(31,68,86,0.35)' },    // Oman
      { lat: 25.29, lng: 51.53, color: 'rgba(31,68,86,0.35)' },    // Qatar
      { lat: 24.71, lng: 46.68, color: 'rgba(31,68,86,0.35)' },    // Saudi Arabia
      { lat: 25.20, lng: 55.27, color: 'rgba(31,68,86,0.35)' },    // UAE
      // North America
      { lat: 43.65, lng: -79.38, color: 'rgba(31,68,86,0.35)' },   // Canada
      { lat: 40.71, lng: -74.01, color: 'rgba(31,68,86,0.35)' },   // USA
      // South America
      { lat: -34.60, lng: -58.38, color: 'rgba(31,68,86,0.35)' },  // Argentina
      { lat: -23.55, lng: -46.63, color: 'rgba(31,68,86,0.35)' },  // Brazil
      { lat: -33.45, lng: -70.67, color: 'rgba(31,68,86,0.35)' },  // Chile
      { lat: 4.71, lng: -74.07, color: 'rgba(31,68,86,0.35)' },    // Colombia
      { lat: -12.05, lng: -77.04, color: 'rgba(31,68,86,0.35)' },  // Peru
    ],
  };

  private locationCards = [
    'assets/LocationBrandCard-IC.png',
    'assets/LocationBrandCard-IN.png',
    'assets/LocationBrandCard-K.png',
    'assets/LocationBrandCard-Reg.png',
    'assets/LocationBrandCard-SS.png',
    'assets/LocationBrandCard-Vig.png',
  ];

  // Doubled so there's always a seamless copy ahead
  tickerCards = [...this.locationCards, ...this.locationCards];

  @ViewChild('tickerTrack') tickerTrack!: ElementRef<HTMLElement>;
  @ViewChild('tickerTrackMobile') tickerTrackMobile!: ElementRef<HTMLElement>;

  private rafId: number | null = null;
  private offset = 0;
  private speed = 0.3; // px per frame

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        this.offset += this.speed;
        const track = this.tickerTrack?.nativeElement ?? this.tickerTrackMobile?.nativeElement;
        if (track) {
          // Reset when we've scrolled exactly half (one full set)
          const halfWidth = track.scrollWidth / 2;
          if (this.offset >= halfWidth) {
            this.offset -= halfWidth;
          }
          // Apply to both tracks
          if (this.tickerTrack?.nativeElement) {
            this.tickerTrack.nativeElement.style.transform = `translateX(-${this.offset}px)`;
          }
          if (this.tickerTrackMobile?.nativeElement) {
            this.tickerTrackMobile.nativeElement.style.transform = `translateX(-${this.offset}px)`;
          }
        }
        this.rafId = requestAnimationFrame(animate);
      };
      this.rafId = requestAnimationFrame(animate);
    });
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }


  onFirstMessage(message: string): void {
    this.messageSent.emit(message);
    this.dismissed.emit();
  }
}
