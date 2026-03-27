import { Component, Input, Output, EventEmitter, OnDestroy, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from './input.component';
import * as L from 'leaflet';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, InputComponent],
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

  searchChips = [
    {
      text: 'NYC hotels with a view',
      icon: 'ph ph-buildings'
    },
    {
      text: 'Budget-friendly hotels near the Louvre',
      icon: 'ph ph-tag'
    },
    {
      text: 'Family beachfront hotels in Florida',
      icon: 'ph ph-umbrella'
    }
  ];

  /** Hotel location points for the background map */
  hotelLocations: [number, number][] = [
    [-8.84, 13.23], [30.04, 31.24], [-20.16, 57.50], [-33.93, 18.42], [-15.39, 28.32],
    [23.81, 90.41], [22.32, 114.17], [19.08, 72.88], [-6.21, 106.85], [35.68, 139.69],
    [37.57, 126.98], [22.20, 113.55], [31.23, 121.47], [3.14, 101.69], [4.18, 73.51],
    [27.70, 85.32], [1.35, 103.82], [25.03, 121.57], [13.75, 100.52], [21.03, 105.85],
    [-33.87, 151.21], [-18.14, 178.44], [-17.54, -149.57], [-36.85, 174.76],
    [48.21, 16.37], [40.41, 49.87], [42.70, 23.32], [48.86, 2.35], [52.52, 13.41],
    [37.98, 23.73], [47.50, 19.04], [53.35, -6.26], [32.08, 34.78], [41.90, 12.50],
    [43.24, 76.95], [35.90, 14.51], [52.37, 4.90], [52.23, 21.01], [38.72, -9.14],
    [44.43, 26.10], [46.05, 14.51], [40.42, -3.70], [41.01, 28.98], [50.45, 30.52],
    [51.51, -0.13], [41.31, 69.28], [9.93, -84.09], [15.30, -61.39], [18.49, -69.93],
    [13.69, -89.19], [12.05, -61.75], [14.63, -90.51], [14.08, -87.21], [19.43, -99.13],
    [12.15, -86.27], [9.00, -79.52], [31.95, 35.93], [33.89, 35.50], [23.59, 58.38],
    [25.29, 51.53], [24.71, 46.68], [25.20, 55.27], [43.65, -79.38], [40.71, -74.01],
    [-34.60, -58.38], [-23.55, -46.63], [-33.45, -70.67], [4.71, -74.07], [-12.05, -77.04],
  ];

  private map: L.Map | null = null;

  private locationCards = [
    'assets/LocationBrandCard-SS.png',
    'assets/LocationBrandCard-Reg.png',
    'assets/LocationBrandCard-IN.png',
    'assets/LocationBrandCard-Vig.png',
    'assets/LocationBrandCard-IC.png',
    'assets/LocationBrandCard-K.png',
  ];

  private locationCardsDesktop = [
    'assets/LocationBrandCard-SS-desk.png',
    'assets/LocationBrandCard-Reg-desk.png',
    'assets/LocationBrandCard-IN-desk.png',
    'assets/LocationBrandCard-Vig-desk.png',
    'assets/LocationBrandCard-IC-desk.png',
    'assets/LocationBrandCard-K-desk.png',
  ];

  // Doubled so there's always a seamless copy ahead
  tickerCards = [...this.locationCards, ...this.locationCards];
  tickerCardsDesktop = [...this.locationCardsDesktop, ...this.locationCardsDesktop];

  @ViewChild('tickerTrack') tickerTrack!: ElementRef<HTMLElement>;
  @ViewChild('tickerTrackMobile') tickerTrackMobile!: ElementRef<HTMLElement>;
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLElement>;

  private rafId: number | null = null;
  private offset = 0;
  private speed = 0.15; // px per frame

  private mapPanOffset = 0;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    // Initialize Leaflet background map (desktop only)
    if (this.mapContainer?.nativeElement) {
      this.map = L.map(this.mapContainer.nativeElement, {
        center: [30, 0],
        zoom: 3,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(this.map);

      // Plot hotel location dots
      for (const [lat, lng] of this.hotelLocations) {
        L.circleMarker([lat, lng], {
          radius: 3,
          fillColor: '#1F4456',
          fillOpacity: 0.4,
          stroke: false,
        }).addTo(this.map);
      }
    }

    // Ticker animation
    // Ticker animation + map slow pan
    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        this.offset += this.speed;
        const track = this.tickerTrack?.nativeElement ?? this.tickerTrackMobile?.nativeElement;
        if (track) {
          const halfWidth = track.scrollWidth / 2;
          if (this.offset >= halfWidth) {
            this.offset -= halfWidth;
          }
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
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }


  onFirstMessage(message: string): void {
    this.messageSent.emit(message);
    this.dismissed.emit();
  }
}
