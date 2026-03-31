import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchContext } from '../models/message.model';

@Component({
  selector: 'app-search-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="search-divider" *ngIf="context" role="status" [attr.aria-label]="'Search context: ' + getLocation() + ', ' + formatDates() + ', ' + getPriceLabel()">
      <span class="divider-text">
        {{ getLocation() }} · {{ formatDates() }}
      </span>
    </div>
  `,
  styles: [`
    .search-divider {
      width: 100%;
      padding: 12px 0 8px;
    }
    .divider-text {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      letter-spacing: 0.01em;
    }
  `]
})
export class SearchSummaryComponent {
  @Input() context!: SearchContext;

  getLocation(): string {
    const loc = this.context.location.split('.')[0].trim();
    return loc || 'NYC';
  }

  getSummary(): string {
    return this.context.summary || 'Hotel search';
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
    return this.context.pricingMode === 'points' ? 'Points' : this.context.pricingMode === 'points+cash' ? 'Points + Cash' : 'USD';
  }

  private shortDate(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private shortDateObj(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
