import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Input,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { feature } from 'topojson-client';

interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  logo: string;
  brandName: string;
}

@Component({
  selector: 'app-globe',
  standalone: true,
  imports: [CommonModule],
  template: `<div #globeContainer class="globe-wrapper"></div>`,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .globe-wrapper { width: 100%; height: 100%; }
  `]
})
export class GlobeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('globeContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @Input() width = 700;
  @Input() height = 700;

  private globe: any;
  private animationId: any;
  private arcTimer: any;

  /** Brand logos mapped to cities */
  private readonly brands = [
    { name: 'Holiday Inn', logo: 'assets/holiday-inn-logo.png' },
    { name: 'InterContinental', logo: 'assets/intercontinental-logo.png' },
    { name: 'Kimpton', logo: 'assets/kimpton-logo.png' },
    { name: 'voco', logo: 'assets/voco-logo.png' },
    { name: 'IHG', logo: 'assets/IHG.svg' },
  ];

  /** Arc routes — origin → destination with brand at destination */
  private readonly routes: ArcData[] = [
    { startLat: 40.71, startLng: -74.00, endLat: 51.507, endLng: -0.127, color: '#1F4456', logo: 'assets/intercontinental-logo.png', brandName: 'InterContinental' },
    { startLat: 51.507, startLng: -0.127, endLat: 35.68, endLng: 139.69, color: '#1F4456', logo: 'assets/holiday-inn-logo.png', brandName: 'Holiday Inn' },
    { startLat: 35.68, startLng: 139.69, endLat: 25.20, endLng: 55.27, color: '#1F4456', logo: 'assets/kimpton-logo.png', brandName: 'Kimpton' },
    { startLat: 25.20, startLng: 55.27, endLat: -33.86, endLng: 151.21, color: '#1F4456', logo: 'assets/voco-logo.png', brandName: 'voco' },
    { startLat: -33.86, startLng: 151.21, endLat: 48.85, endLng: 2.35, color: '#1F4456', logo: 'assets/IHG.svg', brandName: 'IHG' },
    { startLat: 48.85, startLng: 2.35, endLat: 1.35, endLng: 103.82, color: '#1F4456', logo: 'assets/intercontinental-logo.png', brandName: 'InterContinental' },
    { startLat: 1.35, startLng: 103.82, endLat: 34.05, endLng: -118.24, color: '#1F4456', logo: 'assets/holiday-inn-logo.png', brandName: 'Holiday Inn' },
    { startLat: 34.05, startLng: -118.24, endLat: -22.91, endLng: -43.17, color: '#1F4456', logo: 'assets/kimpton-logo.png', brandName: 'Kimpton' },
  ];

  /** Marker points for small dots on the globe */
  private readonly markerPoints = [
    { lat: 29.76, lng: -95.37, size: 0.07 },
    { lat: 28.54, lng: -81.38, size: 0.06 },
    { lat: 40.71, lng: -74.00, size: 0.06 },
    { lat: 41.88, lng: -87.63, size: 0.05 },
    { lat: 34.05, lng: -118.24, size: 0.05 },
    { lat: 43.65, lng: -79.38, size: 0.04 },
    { lat: 19.43, lng: -99.13, size: 0.04 },
    { lat: 51.507, lng: -0.127, size: 0.06 },
    { lat: 52.52, lng: 13.405, size: 0.06 },
    { lat: 48.85, lng: 2.35, size: 0.04 },
    { lat: 41.01, lng: 28.97, size: 0.04 },
    { lat: 40.42, lng: -3.70, size: 0.04 },
    { lat: 31.23, lng: 121.47, size: 0.06 },
    { lat: 39.90, lng: 116.40, size: 0.05 },
    { lat: 35.68, lng: 139.69, size: 0.04 },
    { lat: 13.75, lng: 100.50, size: 0.04 },
    { lat: 1.35, lng: 103.82, size: 0.04 },
    { lat: 25.20, lng: 55.27, size: 0.05 },
    { lat: 19.07, lng: 72.88, size: 0.04 },
    { lat: -26.20, lng: 28.04, size: 0.04 },
    { lat: -33.92, lng: 18.42, size: 0.04 },
    { lat: -1.29, lng: 36.82, size: 0.03 },
    { lat: 30.04, lng: 31.24, size: 0.04 },
    { lat: -23.55, lng: -46.63, size: 0.04 },
    { lat: -22.91, lng: -43.17, size: 0.04 },
    { lat: -34.60, lng: -58.38, size: 0.03 },
    { lat: -33.86, lng: 151.21, size: 0.04 },
    { lat: -37.81, lng: 144.96, size: 0.04 },
  ];

  private countriesData: any = null;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initGlobe();
    });
  }

  ngOnDestroy(): void {
    if (this.arcTimer) clearInterval(this.arcTimer);
    if (this.globe) {
      // Clean up Three.js renderer
      const renderer = this.globe.renderer();
      if (renderer) {
        renderer.dispose();
      }
    }
  }

  private async initGlobe(): Promise<void> {
    const GlobeModule = await import('globe.gl');
    const Globe = GlobeModule.default;

    // Load country polygons for minimal land rendering
    try {
      const res = await fetch('//unpkg.com/world-atlas@2/countries-110m.json');
      const worldData = await res.json();
      this.countriesData = (feature(worldData, worldData.objects.countries) as any).features;
    } catch (e) {
      this.countriesData = [];
    }

    const container = this.containerRef.nativeElement;

    this.globe = new Globe(container)
      .globeImageUrl('')
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(true)
      .atmosphereColor('rgba(255,255,255,0.6)')
      .atmosphereAltitude(0.12)
      .width(this.width)
      .height(this.height)
      // Country polygons — light gray land on white globe
      .polygonsData(this.countriesData)
      .polygonCapColor(() => 'rgba(200, 200, 200, 0.35)')
      .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
      .polygonStrokeColor(() => 'rgba(180, 180, 180, 0.4)')
      .polygonAltitude(0.005)
      // Dots rendered as HTML elements with CSS radial gradient
      .customLayerData([])
      // Points (flat dots on globe surface)
      .pointsData(this.markerPoints)
      .pointLat('lat')
      .pointLng('lng')
      .pointColor(() => '#1F4456')
      .pointAltitude(0)
      .pointRadius((d: any) => d.size * 8)
      .pointsMerge(true)
      // Arcs — fountain-style traveling segment
      .arcsData([])
      .arcStartLat('startLat')
      .arcStartLng('startLng')
      .arcEndLat('endLat')
      .arcEndLng('endLng')
      .arcColor('color')
      .arcDashLength(0.5)
      .arcDashGap(2)
      .arcDashInitialGap(1)
      .arcDashAnimateTime(1200)
      .arcStroke(0.3)
      .arcCurveResolution(64)
      .arcAltitudeAutoScale(0.4)
      // HTML elements for brand logos — start empty
      .htmlElementsData([])
      .htmlLat((d: any) => d.lat)
      .htmlLng((d: any) => d.lng)
      .htmlAltitude(0.02)
      .htmlElement((d: any) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
          opacity: 0;
          transform: scale(0);
          transition: opacity 0.6s ease, transform 0.6s ease;
          pointer-events: none;
        `;
        const img = document.createElement('img');
        img.src = d.logo;
        img.alt = d.brandName;
        img.style.cssText = 'width: 28px; height: 28px; object-fit: contain;';
        wrapper.appendChild(img);
        requestAnimationFrame(() => {
          setTimeout(() => {
            wrapper.style.opacity = '1';
            wrapper.style.transform = 'scale(1)';
          }, 100);
        });
        return wrapper;
      });

    // Style the globe material — clean white sphere like the previous cobe globe
    const globeMaterial = this.globe.globeMaterial();
    globeMaterial.color.set('#f5f5f5');
    globeMaterial.emissive.set('#ffffff');
    globeMaterial.emissiveIntensity = 0.15;
    globeMaterial.shininess = 0.1;

    // Set initial camera position
    this.globe.pointOfView({ lat: 20, lng: 0, altitude: 2.2 });

    // Auto-rotate
    const controls = this.globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.enableZoom = false;
    controls.enablePan = false;

    // Start sequential arc animation
    this.startArcSequence();
  }

  private startArcSequence(): void {
    const activeArcs: any[] = [];
    const activeLogos: any[] = [];
    let currentIndex = 0;
    const ARC_TRAVEL_TIME = 1200;
    const DELAY_BETWEEN = 800;

    const addNextArc = () => {
      if (currentIndex >= this.routes.length) {
        setTimeout(() => {
          activeArcs.length = 0;
          activeLogos.length = 0;
          currentIndex = 0;
          this.globe.arcsData([]);
          this.globe.htmlElementsData([]);
          setTimeout(addNextArc, 1000);
        }, 4000);
        return;
      }

      const route = this.routes[currentIndex];
      activeArcs.push({ ...route });
      this.globe.arcsData([...activeArcs]);

      setTimeout(() => {
        activeLogos.push({
          lat: route.endLat,
          lng: route.endLng,
          logo: route.logo,
          brandName: route.brandName
        });
        this.globe.htmlElementsData([...activeLogos]);

        currentIndex++;
        setTimeout(addNextArc, DELAY_BETWEEN);
      }, ARC_TRAVEL_TIME);
    };

    setTimeout(addNextArc, 1500);
  }
}
