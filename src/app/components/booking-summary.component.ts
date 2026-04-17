import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-booking-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="booking-summary">
      <div class="summary-header">
        <h3 class="summary-title">Select guests and dates</h3>
        <p class="summary-subtext">Fill in your trip information to check availability and pricing</p>
      </div>

      <div class="summary-rows">
        <!-- Guests Row -->
        <button class="summary-row" (click)="openGuests.emit()" type="button">
          <div class="row-left">
            <i class="ph ph-user row-icon" aria-hidden="true"></i>
            <div class="row-content">
              <span class="row-label">ROOMS &amp; GUESTS</span>
              <span class="row-value">{{ getGuestText() }}</span>
            </div>
          </div>
          <i class="ph ph-caret-right row-chevron" aria-hidden="true"></i>
        </button>

        <div class="row-divider"></div>

        <!-- Dates Row -->
        <button class="summary-row" (click)="openDates.emit()" type="button">
          <div class="row-left">
            <i class="ph ph-calendar-blank row-icon" aria-hidden="true"></i>
            <div class="row-content">
              <span class="row-label">DATES</span>
              <span class="row-value">{{ getDatesText() }}</span>
            </div>
          </div>
          <i class="ph ph-caret-right row-chevron" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .booking-summary {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: var(--radius-lg, 12px);
      padding: 16px;
    }

    .summary-header {
      margin-bottom: 16px;
    }

    .summary-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4px 0;
    }

    .summary-subtext {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
      line-height: 1.4;
    }

    .summary-rows {
      display: flex;
      flex-direction: column;
    }

    .summary-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      cursor: pointer;
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      font-family: inherit;
    }

    .summary-row:hover {
      opacity: 0.8;
    }

    .row-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .row-icon {
      font-size: 20px;
      color: #6b7280;
    }

    .row-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .row-label {
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
      letter-spacing: 0.5px;
    }

    .row-value {
      font-size: 14px;
      color: #111827;
      font-weight: 500;
    }

    .row-chevron {
      font-size: 18px;
      color: #9ca3af;
    }

    .row-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 0;
    }
  `]
})
export class BookingSummaryComponent {
  @Input() adults: number = 2;
  @Input() children: number = 0;
  @Input() checkIn: Date | null = null;
  @Input() checkOut: Date | null = null;

  @Output() openGuests = new EventEmitter<void>();
  @Output() openDates = new EventEmitter<void>();

  getGuestText(): string {
    const totalGuests = this.adults + this.children;
    return `1 Room, ${totalGuests} Guest(s)`;
  }

  getDatesText(): string {
    const ci = this.checkIn || new Date();
    const co = this.checkOut || this.getDefaultCheckOut();
    return `${this.formatDate(ci)} → ${this.formatDate(co)}`;
  }

  private getDefaultCheckOut(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  private formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }
}
