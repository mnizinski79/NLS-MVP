import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from './input.component';
import { NgxGlobeComponent } from '@omnedia/ngx-globe';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, InputComponent, NgxGlobeComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
/**
 * LandingComponent - Full-screen landing page
 *
 * Displays the initial landing view before first search with:
 * - Full-screen background image
 * - Semi-transparent header (50% opacity)
 * - Welcome message with example queries
 * - Semi-transparent input bar (50% opacity)
 * - Smooth fade-out transition on first message
 *
 * @example
 * <app-landing
 *   [visible]="showLanding"
 *   (dismissed)="handleLandingDismissed()">
 * </app-landing>
 */
export class LandingComponent {
  /** Whether the landing page is visible */
  @Input() visible: boolean = true;

  /** Emitted when landing is dismissed (first message sent) */
  @Output() dismissed = new EventEmitter<void>();
  
  /** Emitted when user sends first message */
  @Output() messageSent = new EventEmitter<string>();

  /** Example queries to display in welcome box */
  exampleQueries: string[] = [
    'Show me luxury hotels in Midtown',
    'Find pet-friendly hotels with a rooftop bar',
    'What are the cheapest options near Times Square?'
  ];

  /** Globe configuration */
  globeOptions = {
    markers: [
      // North America
      { location: [29.76, -95.37] as [number, number], size: 0.07 }, // Texas (Houston area - consolidated)
      { location: [28.54, -81.38] as [number, number], size: 0.06 }, // Orlando
      { location: [40.71, -74.00] as [number, number], size: 0.06 }, // New York
      { location: [41.88, -87.63] as [number, number], size: 0.05 }, // Chicago
      { location: [34.05, -118.24] as [number, number], size: 0.05 }, // Los Angeles
      { location: [43.65, -79.38] as [number, number], size: 0.04 }, // Toronto
      { location: [19.43, -99.13] as [number, number], size: 0.04 }, // Mexico City
      
      // Europe
      { location: [51.507, -0.127] as [number, number], size: 0.06 }, // London
      { location: [52.52, 13.405] as [number, number], size: 0.06 }, // Berlin
      { location: [48.85, 2.35] as [number, number], size: 0.04 }, // Paris
      { location: [41.01, 28.97] as [number, number], size: 0.04 }, // Istanbul
      { location: [40.42, -3.70] as [number, number], size: 0.04 }, // Madrid
      
      // Asia
      { location: [31.23, 121.47] as [number, number], size: 0.06 }, // Shanghai
      { location: [39.90, 116.40] as [number, number], size: 0.05 }, // Beijing
      { location: [35.68, 139.69] as [number, number], size: 0.04 }, // Tokyo
      { location: [13.75, 100.50] as [number, number], size: 0.04 }, // Bangkok
      { location: [1.35, 103.82] as [number, number], size: 0.04 }, // Singapore
      { location: [25.20, 55.27] as [number, number], size: 0.05 }, // Dubai
      { location: [19.07, 72.88] as [number, number], size: 0.04 }, // Mumbai
      
      // Africa
      { location: [-26.20, 28.04] as [number, number], size: 0.04 }, // Johannesburg
      { location: [-33.92, 18.42] as [number, number], size: 0.04 }, // Cape Town
      { location: [-1.29, 36.82] as [number, number], size: 0.03 }, // Nairobi
      { location: [30.04, 31.24] as [number, number], size: 0.04 }, // Cairo
      { location: [-6.16, 35.75] as [number, number], size: 0.03 }, // Dar es Salaam
      
      // South America
      { location: [-23.55, -46.63] as [number, number], size: 0.04 }, // Sao Paulo
      { location: [-22.91, -43.17] as [number, number], size: 0.04 }, // Rio de Janeiro
      { location: [-34.60, -58.38] as [number, number], size: 0.03 }, // Buenos Aires
      
      // Australia
      { location: [-33.86, 151.21] as [number, number], size: 0.04 }, // Sydney
      { location: [-37.81, 144.96] as [number, number], size: 0.04 }, // Melbourne
    ],
    baseColor: [0.9, 0.9, 0.9] as [number, number, number],
    glowColor: [0.95, 0.95, 0.95] as [number, number, number],
    markerColor: [0.12, 0.27, 0.34] as [number, number, number], // #1F4456 in RGB
    mapBrightness: 1.0,
    diffuse: 1.0,
  };

  /**
   * Handle first message submission
   * Dismisses landing page and passes message to parent
   * @param message - User's first query
   */
  onFirstMessage(message: string): void {
    // Emit message first, then dismiss
    this.messageSent.emit(message);
    this.dismissed.emit();
  }
}
