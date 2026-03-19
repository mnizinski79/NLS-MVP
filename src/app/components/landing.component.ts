import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from './input.component';
import { NgxThreeGlobeComponent, ThreeGlobePosition } from '@omnedia/ngx-three-globe';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, InputComponent, NgxThreeGlobeComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  @Input() visible: boolean = true;
  @Output() dismissed = new EventEmitter<void>();
  @Output() messageSent = new EventEmitter<string>();

  exampleQueries: string[] = [
    'Show me luxury hotels in Midtown',
    'Cheapest options near Times Square'
  ];

  /** Globe configuration — minimal light style */
  globeConfig: any = {
    pointSize: 0.5,
    globeColor: '#f8f8f8',
    showAtmosphere: true,
    atmosphereColor: '#e8eaed',
    atmosphereAltitude: 0.15,
    emissive: '#ffffff',
    emissiveIntensity: 0.3,
    shininess: 0.05,
    polygonColor: 'rgba(80, 80, 80, 0.7)',
    ambientLight: '#ffffff',
    directionalLeftLight: '#ffffff',
    directionalTopLight: '#ffffff',
    pointLight: '#ffffff',
    arcTime: 3000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 2,
    autoRotate: true,
    autoRotateSpeed: 0.4,
    initialPosition: { lat: 20, lng: 0 },
    extraPoints: [
      // Africa
      { lat: -8.84, lng: 13.23, color: '#1F4456' },    // Angola
      { lat: 30.04, lng: 31.24, color: '#1F4456' },    // Egypt
      { lat: -20.16, lng: 57.50, color: '#1F4456' },   // Mauritius
      { lat: -33.93, lng: 18.42, color: '#1F4456' },   // South Africa
      { lat: -15.39, lng: 28.32, color: '#1F4456' },   // Zambia
      // Asia
      { lat: 23.81, lng: 90.41, color: '#1F4456' },    // Bangladesh
      { lat: 22.32, lng: 114.17, color: '#1F4456' },   // Hong Kong
      { lat: 19.08, lng: 72.88, color: '#1F4456' },    // India
      { lat: -6.21, lng: 106.85, color: '#1F4456' },   // Indonesia
      { lat: 35.68, lng: 139.69, color: '#1F4456' },   // Japan
      { lat: 37.57, lng: 126.98, color: '#1F4456' },   // South Korea
      { lat: 22.20, lng: 113.55, color: '#1F4456' },   // Macao
      { lat: 31.23, lng: 121.47, color: '#1F4456' },   // China
      { lat: 3.14, lng: 101.69, color: '#1F4456' },    // Malaysia
      { lat: 4.18, lng: 73.51, color: '#1F4456' },     // Maldives
      { lat: 27.70, lng: 85.32, color: '#1F4456' },    // Nepal
      { lat: 1.35, lng: 103.82, color: '#1F4456' },    // Singapore
      { lat: 25.03, lng: 121.57, color: '#1F4456' },   // Taiwan
      { lat: 13.75, lng: 100.52, color: '#1F4456' },   // Thailand
      { lat: 21.03, lng: 105.85, color: '#1F4456' },   // Vietnam
      // Oceania
      { lat: -33.87, lng: 151.21, color: '#1F4456' },  // Australia
      { lat: -18.14, lng: 178.44, color: '#1F4456' },  // Fiji
      { lat: -17.54, lng: -149.57, color: '#1F4456' }, // French Polynesia
      { lat: -36.85, lng: 174.76, color: '#1F4456' },  // New Zealand
      // Europe
      { lat: 48.21, lng: 16.37, color: '#1F4456' },    // Austria
      { lat: 40.41, lng: 49.87, color: '#1F4456' },    // Azerbaijan
      { lat: 42.70, lng: 23.32, color: '#1F4456' },    // Bulgaria
      { lat: 48.86, lng: 2.35, color: '#1F4456' },     // France
      { lat: 52.52, lng: 13.41, color: '#1F4456' },    // Germany
      { lat: 37.98, lng: 23.73, color: '#1F4456' },    // Greece
      { lat: 47.50, lng: 19.04, color: '#1F4456' },    // Hungary
      { lat: 53.35, lng: -6.26, color: '#1F4456' },    // Ireland
      { lat: 32.08, lng: 34.78, color: '#1F4456' },    // Israel
      { lat: 41.90, lng: 12.50, color: '#1F4456' },    // Italy
      { lat: 43.24, lng: 76.95, color: '#1F4456' },    // Kazakhstan
      { lat: 35.90, lng: 14.51, color: '#1F4456' },    // Malta
      { lat: 52.37, lng: 4.90, color: '#1F4456' },     // Netherlands
      { lat: 52.23, lng: 21.01, color: '#1F4456' },    // Poland
      { lat: 38.72, lng: -9.14, color: '#1F4456' },    // Portugal
      { lat: 44.43, lng: 26.10, color: '#1F4456' },    // Romania
      { lat: 46.05, lng: 14.51, color: '#1F4456' },    // Slovenia
      { lat: 40.42, lng: -3.70, color: '#1F4456' },    // Spain
      { lat: 41.01, lng: 28.98, color: '#1F4456' },    // Turkey
      { lat: 50.45, lng: 30.52, color: '#1F4456' },    // Ukraine
      { lat: 51.51, lng: -0.13, color: '#1F4456' },    // UK
      { lat: 41.31, lng: 69.28, color: '#1F4456' },    // Uzbekistan
      // Central America & Caribbean
      { lat: 9.93, lng: -84.09, color: '#1F4456' },    // Costa Rica
      { lat: 15.30, lng: -61.39, color: '#1F4456' },   // Dominica
      { lat: 18.49, lng: -69.93, color: '#1F4456' },   // Dominican Republic
      { lat: 13.69, lng: -89.19, color: '#1F4456' },   // El Salvador
      { lat: 12.05, lng: -61.75, color: '#1F4456' },   // Grenada
      { lat: 14.63, lng: -90.51, color: '#1F4456' },   // Guatemala
      { lat: 14.08, lng: -87.21, color: '#1F4456' },   // Honduras
      { lat: 19.43, lng: -99.13, color: '#1F4456' },   // Mexico
      { lat: 12.15, lng: -86.27, color: '#1F4456' },   // Nicaragua
      { lat: 9.00, lng: -79.52, color: '#1F4456' },    // Panama
      // Middle East
      { lat: 31.95, lng: 35.93, color: '#1F4456' },    // Jordan
      { lat: 33.89, lng: 35.50, color: '#1F4456' },    // Lebanon
      { lat: 23.59, lng: 58.38, color: '#1F4456' },    // Oman
      { lat: 25.29, lng: 51.53, color: '#1F4456' },    // Qatar
      { lat: 24.71, lng: 46.68, color: '#1F4456' },    // Saudi Arabia
      { lat: 25.20, lng: 55.27, color: '#1F4456' },    // UAE
      // North America
      { lat: 43.65, lng: -79.38, color: '#1F4456' },   // Canada
      { lat: 40.71, lng: -74.01, color: '#1F4456' },   // USA
      // South America
      { lat: -34.60, lng: -58.38, color: '#1F4456' },  // Argentina
      { lat: -23.55, lng: -46.63, color: '#1F4456' },  // Brazil
      { lat: -33.45, lng: -70.67, color: '#1F4456' },  // Chile
      { lat: 4.71, lng: -74.07, color: '#1F4456' },    // Colombia
      { lat: -12.05, lng: -77.04, color: '#1F4456' },  // Peru
    ],
  };

  /** Showcase arcs between major hub cities */
  globeArcs: ThreeGlobePosition[] = [
    { order: 1, startLat: 40.71, startLng: -74.01, endLat: 51.51, endLng: -0.13, arcAlt: 0.3, color: '#1F4456' },
    { order: 2, startLat: 51.51, startLng: -0.13, endLat: 25.20, endLng: 55.27, arcAlt: 0.3, color: '#1F4456' },
    { order: 3, startLat: 25.20, startLng: 55.27, endLat: 1.35, endLng: 103.82, arcAlt: 0.3, color: '#1F4456' },
    { order: 4, startLat: 1.35, startLng: 103.82, endLat: 35.68, endLng: 139.69, arcAlt: 0.25, color: '#1F4456' },
    { order: 5, startLat: 35.68, startLng: 139.69, endLat: -33.87, endLng: 151.21, arcAlt: 0.35, color: '#1F4456' },
    { order: 6, startLat: -33.87, startLng: 151.21, endLat: 48.86, endLng: 2.35, arcAlt: 0.4, color: '#1F4456' },
    { order: 7, startLat: 48.86, startLng: 2.35, endLat: -23.55, endLng: -46.63, arcAlt: 0.35, color: '#1F4456' },
    { order: 8, startLat: -23.55, startLng: -46.63, endLat: 34.05, endLng: -118.24, arcAlt: 0.3, color: '#1F4456' },
  ];

  onFirstMessage(message: string): void {
    this.messageSent.emit(message);
    this.dismissed.emit();
  }
}
