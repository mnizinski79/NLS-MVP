import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
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
export class LandingComponent implements OnInit, OnDestroy {
  @Input() visible: boolean = true;
  @Output() dismissed = new EventEmitter<void>();
  @Output() messageSent = new EventEmitter<string>();

  exampleQueries: string[] = [
    'Show me luxury hotels in Midtown',
    'Find pet-friendly hotels with a rooftop bar'
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

  /** Brand logos for floating animation (logos only) */
  private brandLogos = [
    { name: 'InterContinental', logo: 'assets/intercontinental-logo.png' },
    { name: 'Voco', logo: 'assets/voco-logo.png' },
    { name: 'Kimpton', logo: 'assets/kimpton-logo.png' },
    { name: 'Holiday Inn', logo: 'assets/holiday-inn-logo.png' },
    { name: 'Atwell Suites', logo: 'assets/Brand=Atwell Suites.svg' },
    { name: 'Avid', logo: 'assets/Brand=Avid.svg' },
    { name: 'Candlewood', logo: 'assets/Brand=Candlewood.svg' },
    { name: 'Crowne Plaza', logo: 'assets/Brand=Crowne Plaza.svg' },
    { name: 'Even', logo: 'assets/Brand=Even.svg' },
    { name: 'Garner', logo: 'assets/Brand=Garner.svg' },
    { name: 'Holiday Inn Resorts', logo: 'assets/Brand=Holiday Inn Resorts.svg' },
    { name: 'Hualuxe', logo: 'assets/Brand=Hualuxe.svg' },
    { name: 'Iberostar', logo: 'assets/Brand=Iberostar.svg' },
    { name: 'Indigo', logo: 'assets/Brand=Indigo.svg' },
    { name: 'Regent', logo: 'assets/Brand=Regent.svg' },
    { name: 'Ruby', logo: 'assets/Brand=Ruby.svg' },
    { name: 'Six Senses', logo: 'assets/Brand=Six Senses.svg' },
    { name: 'Staybridge', logo: 'assets/Brand=Staybridge.svg' },
    { name: 'Vignette', logo: 'assets/Brand=Vignette.svg' },
  ];

  /** Property photos for floating animation */
  private propertyPhotos = [
    'assets/property-1.jpg',
    'assets/property-2.jpg',
    'assets/property-3.jpg',
    'assets/property-4.jpg',
    'assets/property-5.jpg',
    'assets/property-6.jpg',
    'assets/property-7.jpg',
    'assets/property-8.jpg',
    'assets/property-9.jpg',
    'assets/property-10.jpg',
    'assets/property-12.jpg',
    'assets/property-13.jpg',
  ];

  /** Fixed positions around the globe edge for logos — varied distances for organic feel */
  private slotPositions = [
    { x: 8, y: -2, size: 30 },     // top-left (close)
    { x: 42, y: -14, size: 28 },   // top-center (far)
    { x: 75, y: -4, size: 32 },    // top-right (close)
    { x: 105, y: 8, size: 34 },    // right-upper (far)
    { x: 98, y: 38, size: 30 },    // right-middle (close)
    { x: 108, y: 68, size: 36 },   // right-lower (far)
    { x: 82, y: 100, size: 28 },   // bottom-right (far)
    { x: 48, y: 94, size: 34 },    // bottom-center (close)
    { x: 10, y: 100, size: 30 },   // bottom-left (far)
    { x: -8, y: 70, size: 32 },    // left-lower (close)
    { x: -20, y: 44, size: 38 },   // left-middle (far)
    { x: -4, y: 10, size: 34 },    // left-upper (close)
  ];

  /** Fixed positions for property photos — pushed to corners, away from logos */
  private photoPositions = [
    { x: -20, y: -12 },   // top-left corner
    { x: 90, y: -14 },    // top-right corner
    { x: 92, y: 82 },     // bottom-right corner
    { x: -18, y: 84 },    // bottom-left corner
  ];

  brandSlots: { x: number; y: number; size: number; logo: string; name: string; visible: boolean }[] = [];
  photoSlots: { x: number; y: number; src: string; visible: boolean }[] = [];
  private brandTimer: any;
  private photoTimer: any;

  ngOnInit(): void {
    this.brandSlots = this.slotPositions.map(pos => ({
      ...pos, logo: '', name: '', visible: false,
    }));
    this.photoSlots = this.photoPositions.map(pos => ({
      ...pos, src: '', visible: false,
    }));
    this.startBrandAnimation();
    this.startPhotoAnimation();
  }

  ngOnDestroy(): void {
    if (this.brandTimer) clearInterval(this.brandTimer);
    if (this.photoTimer) clearInterval(this.photoTimer);
  }

  private startPhotoAnimation(): void {
    let usedPhotos: number[] = [];
    const pickPhoto = (): number => {
      let idx: number;
      do { idx = Math.floor(Math.random() * this.propertyPhotos.length); }
      while (usedPhotos.includes(idx) && usedPhotos.length < this.propertyPhotos.length);
      return idx;
    };

    // Show 1-2 initially with stagger
    const initial = this.shuffleArray([0, 1, 2, 3]).slice(0, 2);
    initial.forEach((slotIdx, i) => {
      setTimeout(() => {
        const pIdx = pickPhoto();
        usedPhotos.push(pIdx);
        this.photoSlots[slotIdx].src = this.propertyPhotos[pIdx];
        this.photoSlots[slotIdx].visible = true;
      }, 800 + i * 600);
    });

    // Cycle photos
    this.photoTimer = setInterval(() => {
      const visible = this.photoSlots.map((s, i) => ({ ...s, idx: i })).filter(s => s.visible);
      if (visible.length === 0) return;

      const hide = visible[Math.floor(Math.random() * visible.length)];
      this.photoSlots[hide.idx].visible = false;

      setTimeout(() => {
        const hidden = this.photoSlots.map((s, i) => ({ ...s, idx: i })).filter(s => !s.visible && s.idx !== hide.idx);
        if (hidden.length === 0) return;
        const show = hidden[Math.floor(Math.random() * hidden.length)];

        const oldIdx = this.propertyPhotos.indexOf(hide.src);
        usedPhotos = usedPhotos.filter(i => i !== oldIdx);

        const newIdx = pickPhoto();
        usedPhotos.push(newIdx);
        this.photoSlots[show.idx].src = this.propertyPhotos[newIdx];
        this.photoSlots[show.idx].visible = true;
      }, 700);
    }, 8000);
  }

  private startBrandAnimation(): void {
    const showCount = 7;
    let usedLogos: number[] = [];

    const pickRandomLogo = (): number => {
      let idx: number;
      do {
        idx = Math.floor(Math.random() * this.brandLogos.length);
      } while (usedLogos.includes(idx) && usedLogos.length < this.brandLogos.length);
      return idx;
    };

    const initialSlots = this.shuffleArray([...Array(this.slotPositions.length).keys()]).slice(0, showCount);
    initialSlots.forEach((slotIdx, i) => {
      setTimeout(() => {
        const logoIdx = pickRandomLogo();
        usedLogos.push(logoIdx);
        this.brandSlots[slotIdx].logo = this.brandLogos[logoIdx].logo;
        this.brandSlots[slotIdx].name = this.brandLogos[logoIdx].name;
        this.brandSlots[slotIdx].visible = true;
      }, i * 400);
    });

    this.brandTimer = setInterval(() => {
      const visibleSlots = this.brandSlots
        .map((s, i) => ({ ...s, idx: i }))
        .filter(s => s.visible);

      if (visibleSlots.length === 0) return;

      const hideSlot = visibleSlots[Math.floor(Math.random() * visibleSlots.length)];
      this.brandSlots[hideSlot.idx].visible = false;

      setTimeout(() => {
        const hiddenSlots = this.brandSlots
          .map((s, i) => ({ ...s, idx: i }))
          .filter(s => !s.visible);

        if (hiddenSlots.length === 0) return;

        const showSlot = hiddenSlots[Math.floor(Math.random() * hiddenSlots.length)];

        const oldLogoIdx = this.brandLogos.findIndex(b => b.logo === hideSlot.logo);
        usedLogos = usedLogos.filter(i => i !== oldLogoIdx);

        const newLogoIdx = pickRandomLogo();
        usedLogos.push(newLogoIdx);

        this.brandSlots[showSlot.idx].logo = this.brandLogos[newLogoIdx].logo;
        this.brandSlots[showSlot.idx].name = this.brandLogos[newLogoIdx].name;
        this.brandSlots[showSlot.idx].visible = true;
      }, 600);
    }, 3000);
  }

  private shuffleArray(arr: number[]): number[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  onFirstMessage(message: string): void {
    this.messageSent.emit(message);
    this.dismissed.emit();
  }
}
