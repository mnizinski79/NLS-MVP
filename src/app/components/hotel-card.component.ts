import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hotel } from '../models/hotel.model';
import { BRAND_COLORS, BRAND_LOGOS } from '../models/brand-config';
import { ChangeDetectionStrategy } from '@angular/core';
import { PricingService } from '../services/pricing.service';

@Component({
  selector: 'app-hotel-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hotel-card.component.html',
  styleUrls: ['./hotel-card.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
/**
 * HotelCardComponent - Reusable hotel card display
 *
 * Displays hotel information in a card format with two size variants (desktop/mobile).
 * Shows hotel image, name, rating, brand chiclet with logo, and pricing information.
 * Emits click events for opening hotel details.
 *
 * @example
 * <app-hotel-card
 *   [hotel]="hotelData"
 *   [variant]="'desktop'"
 *   [highlighted]="false"
 *   (cardClicked)="onHotelClick($event)">
 * </app-hotel-card>
 */
export class HotelCardComponent {
  /** Hotel data to display */
  @Input() hotel!: Hotel;

  /** Card size variant: 'desktop' (280x340px) or 'mobile' (240x300px) */
  @Input() variant: 'desktop' | 'mobile' = 'desktop';

  /** Whether the card should be visually highlighted */
  @Input() highlighted: boolean = false;

  /** Emitted when the card is clicked, passes the hotel object */
  @Output() cardClicked = new EventEmitter<Hotel>();

  constructor(public pricing: PricingService) {}

  /**
   * Handle card click and emit hotel object
   */
  onClick(): void {
    this.cardClicked.emit(this.hotel);
  }

  /**
   * Get brand-specific color for styling
   * @returns Hex color code for the hotel's brand
   */
  getBrandColor(): string {
    return BRAND_COLORS[this.hotel.brand] || '#000000';
  }

  /**
   * Get brand logo URL
   * @returns Path to brand logo asset
   */
  getBrandLogo(): string {
    return BRAND_LOGOS[this.hotel.brand] || '';
  }

  /**
   * Format nightly rate for display
   * @returns Formatted price string (e.g., "250/night")
   */
  formatPrice(): string {
    const { nightlyRate, roomRate, fees } = this.hotel.pricing;
    return `${nightlyRate.toFixed(0)}/night`;
  }

  /**
   * Get detailed price breakdown
   * @returns Formatted breakdown string showing room rate and fees
   */
  getPriceBreakdown(): string {
    const { roomRate, fees } = this.hotel.pricing;
    return `Room: ${roomRate.toFixed(0)} + Fees: ${fees.toFixed(0)}`;
  }

  /**
   * Generate array for star rating display
   * @returns Array with length equal to hotel rating (for *ngFor)
   */
  getStarArray(): number[] {
    return Array(Math.floor(this.hotel.rating)).fill(0);
  }
}
