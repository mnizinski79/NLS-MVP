import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchContext } from '../models/message.model';
import { PricingService, PricingMode } from '../services/pricing.service';

@Component({
  selector: 'app-search-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="search-summary" *ngIf="context" role="status">
      <span class="summary-text">{{ getLocation() }} · {{ formatDates() }}</span>
      <button class="pricing-pill" (click)="openPricingSheet()" type="button" aria-label="Change pricing view">
        <i class="ph ph-coins pill-icon" aria-hidden="true"></i>
        <span>{{ getPriceLabel() }}</span>
      </button>
    </div>

    <!-- Pricing bottom sheet -->
    <div *ngIf="showPricingSheet" class="sheet-backdrop" (click)="onBackdropClick($event)">
      <div class="sheet-panel" (click)="$event.stopPropagation()">
        <div class="sheet-header">
          <h3 class="sheet-title">Price View</h3>
          <button class="close-btn" (click)="showPricingSheet = false" type="button" aria-label="Close">
            <i class="ph ph-x" aria-hidden="true"></i>
          </button>
        </div>
        <div class="sheet-body">
          <button class="pricing-option" [class.active]="pricing.mode === 'cash'" (click)="selectMode('cash')" type="button">
            <i class="ph ph-currency-dollar option-icon" aria-hidden="true"></i>
            <div class="option-text">
              <span class="option-label">Money</span>
              <span class="option-desc">Pay with USD</span>
            </div>
            <i *ngIf="pricing.mode === 'cash'" class="ph-fill ph-check-circle check-icon" aria-hidden="true"></i>
          </button>
          <button class="pricing-option" [class.active]="pricing.mode === 'points'" (click)="selectMode('points')" type="button">
            <i class="ph ph-coins option-icon" aria-hidden="true"></i>
            <div class="option-text">
              <span class="option-label">Points</span>
              <span class="option-desc">Pay with IHG One Rewards points</span>
            </div>
            <i *ngIf="pricing.mode === 'points'" class="ph-fill ph-check-circle check-icon" aria-hidden="true"></i>
          </button>
          <button class="pricing-option" [class.active]="pricing.mode === 'points+cash'" (click)="selectMode('points+cash')" type="button">
            <i class="ph ph-swap option-icon" aria-hidden="true"></i>
            <div class="option-text">
              <span class="option-label">Points + Cash</span>
              <span class="option-desc">Mix of points and USD</span>
            </div>
            <i *ngIf="pricing.mode === 'points+cash'" class="ph-fill ph-check-circle check-icon" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
    .search-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 8px 0;
      gap: 12px;
    }
    .summary-text {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pricing-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border: 1.5px solid #1F4456;
      border-radius: var(--radius-pill);
      background: transparent;
      color: #1F4456;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .pricing-pill:hover {
      background: rgba(31, 68, 86, 0.06);
    }
    .pill-icon {
      font-size: 16px;
    }

    /* Bottom sheet */
    .sheet-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    }
    .sheet-panel {
      background: #fff;
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      width: 100%;
      max-height: 60vh;
      animation: slideUp 0.3s ease;
      z-index: 10000;
    }
    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    .sheet-title {
      font-size: 17px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #6b7280;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .close-btn:hover {
      background: #f3f4f6;
    }
    .sheet-body {
      padding: 8px 12px 20px;
    }
    .pricing-option {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 14px 12px;
      border: none;
      background: transparent;
      border-radius: var(--radius-md);
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: background 0.15s ease;
    }
    .pricing-option:hover {
      background: #f3f4f6;
    }
    .pricing-option.active {
      background: #f0f7fa;
    }
    .option-icon {
      font-size: 22px;
      color: #1F4456;
      flex-shrink: 0;
    }
    .option-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
      flex: 1;
    }
    .option-label {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
    }
    .option-desc {
      font-size: 12px;
      color: #6b7280;
    }
    .check-icon {
      font-size: 20px;
      color: #1F4456;
      flex-shrink: 0;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
  `]
})
export class SearchSummaryComponent {
  @Input() context!: SearchContext;

  showPricingSheet = false;

  constructor(public pricing: PricingService) {}

  getLocation(): string {
    const loc = this.context.location.split('.')[0].trim();
    return loc || 'NYC';
  }

  formatDates(): string {
    const ci = this.context.checkIn;
    const co = this.context.checkOut;
    if (ci && co) {
      return `${this.shortDate(ci)} → ${this.shortDate(co)}`;
    }
    const today = new Date();
    const tmw = new Date();
    tmw.setDate(tmw.getDate() + 1);
    return `${this.shortDateObj(today)} → ${this.shortDateObj(tmw)}`;
  }

  getPriceLabel(): string {
    if (this.pricing.mode === 'points') return 'Points';
    if (this.pricing.mode === 'points+cash') return 'P + Cash';
    return 'Money';
  }

  openPricingSheet(): void {
    this.showPricingSheet = true;
  }

  selectMode(mode: PricingMode): void {
    this.pricing.setMode(mode);
    this.showPricingSheet = false;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('sheet-backdrop')) {
      this.showPricingSheet = false;
    }
  }

  private shortDate(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private shortDateObj(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
