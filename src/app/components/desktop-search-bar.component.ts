import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricingService, PricingMode } from '../services/pricing.service';

@Component({
  selector: 'app-desktop-search-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="search-bar" *ngIf="location">
      <span class="bar-text">{{ location }} · {{ dates }}</span>
      <div class="pricing-dropdown-wrapper">
        <button class="pricing-pill" (click)="toggleDropdown()" type="button">
          <i class="ph ph-coins pill-icon" aria-hidden="true"></i>
          <span>{{ getPriceLabel() }}</span>
          <i class="ph ph-caret-down caret" [class.open]="showDropdown" aria-hidden="true"></i>
        </button>
        <div class="dropdown-menu" *ngIf="showDropdown">
          <button class="dropdown-item" [class.active]="pricing.mode === 'cash'" (click)="selectMode('cash')">
            <i class="ph ph-currency-dollar" aria-hidden="true"></i> Money
          </button>
          <button class="dropdown-item" [class.active]="pricing.mode === 'points'" (click)="selectMode('points')">
            <i class="ph ph-coins" aria-hidden="true"></i> Points
          </button>
          <button class="dropdown-item" [class.active]="pricing.mode === 'points+cash'" (click)="selectMode('points+cash')">
            <i class="ph ph-swap" aria-hidden="true"></i> Points + Cash
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 24px;
      border-bottom: 1px solid #e5e7eb;
      background: #fff;
      flex-shrink: 0;
    }
    .bar-text {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pricing-dropdown-wrapper {
      position: relative;
    }
    .pricing-pill {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border: 1.5px solid #1F4456;
      border-radius: var(--radius-pill);
      background: transparent;
      color: #1F4456;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      font-family: inherit;
      transition: all 0.15s ease;
    }
    .pricing-pill:hover {
      background: rgba(31, 68, 86, 0.06);
    }
    .pill-icon { font-size: 14px; }
    .caret {
      font-size: 12px;
      transition: transform 0.2s ease;
    }
    .caret.open { transform: rotate(180deg); }
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: var(--radius-md);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      min-width: 160px;
      z-index: 50;
      overflow: hidden;
      animation: dropIn 0.15s ease;
    }
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 10px 14px;
      border: none;
      background: transparent;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      font-family: inherit;
      text-align: left;
      transition: background 0.1s ease;
    }
    .dropdown-item:hover { background: #f3f4f6; }
    .dropdown-item.active {
      color: #1F4456;
      font-weight: 600;
      background: #f0f7fa;
    }
    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class DesktopSearchBarComponent {
  @Input() location: string = '';
  @Input() dates: string = '';

  showDropdown = false;

  constructor(public pricing: PricingService) {}

  getPriceLabel(): string {
    if (this.pricing.mode === 'points') return 'Points';
    if (this.pricing.mode === 'points+cash') return 'P + Cash';
    return 'Money';
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  selectMode(mode: PricingMode): void {
    this.pricing.setMode(mode);
    this.showDropdown = false;
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.pricing-dropdown-wrapper')) {
      this.showDropdown = false;
    }
  }
}
