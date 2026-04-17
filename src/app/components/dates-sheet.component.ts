import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hotel } from '../models/hotel.model';
import { RateCalendarComponent, DateRange } from './rate-calendar.component';

@Component({
  selector: 'app-dates-sheet',
  standalone: true,
  imports: [CommonModule, RateCalendarComponent],
  template: `
    <div *ngIf="visible" class="sheet-backdrop" [class.is-mobile]="isMobile" (click)="onBackdropClick($event)">
      <div class="sheet-panel" [class.is-mobile]="isMobile" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="sheet-header">
          <h3 class="sheet-title">Select Dates</h3>
          <button class="close-btn" (click)="closed.emit()" type="button" aria-label="Close">
            <i class="ph ph-x" aria-hidden="true"></i>
          </button>
        </div>

        <!-- Calendar -->
        <div class="sheet-body">
          <app-rate-calendar
            [visible]="true"
            [inline]="true"
            [hotel]="hotel"
            [basePrice]="(hotel?.pricing?.nightlyRate) || 200"
            [initialCheckIn]="checkIn"
            [initialCheckOut]="checkOut"
            (dateSelected)="onCalendarDatesSelected($event)"
            (closed)="closed.emit()">
          </app-rate-calendar>
        </div>

        <!-- Apply button -->
        <div class="sheet-footer">
          <button class="apply-btn" (click)="onApply()" [disabled]="!canApply" type="button">Apply</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sheet-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease;
    }

    .sheet-backdrop.is-mobile {
      align-items: flex-end;
    }

    .sheet-panel {
      background: #fff;
      border-radius: var(--radius-xl, 16px);
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
      animation: scaleIn 0.2s ease;
    }

    .sheet-panel.is-mobile {
      max-width: 100%;
      max-height: 80vh;
      border-radius: var(--radius-xl, 16px) var(--radius-xl, 16px) 0 0;
      animation: slideUp 0.3s ease;
    }

    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      background: #fff;
      z-index: 1;
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
      padding: 16px;
    }

    .sheet-footer {
      padding: 16px 20px;
      border-top: 1px solid #e5e7eb;
      position: sticky;
      bottom: 0;
      background: #fff;
    }

    .apply-btn {
      width: 100%;
      padding: 14px;
      background: #111827;
      color: #fff;
      border: none;
      border-radius: var(--radius-md, 8px);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .apply-btn:hover:not(:disabled) {
      background: #1f2937;
    }

    .apply-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
  `]
})
export class DatesSheetComponent {
  @Input() visible: boolean = false;
  @Input() hotel: Hotel | null = null;
  @Input() checkIn: Date | null = null;
  @Input() checkOut: Date | null = null;
  @Input() isMobile: boolean = false;

  @Output() closed = new EventEmitter<void>();
  @Output() datesSelected = new EventEmitter<DateRange>();

  @ViewChild(RateCalendarComponent) rateCalendar?: RateCalendarComponent;

  pendingDates: DateRange | null = null;

  onCalendarDatesSelected(dateRange: DateRange): void {
    this.pendingDates = dateRange;
  }

  onApply(): void {
    // Try pending dates first, then read directly from calendar
    if (this.pendingDates) {
      this.datesSelected.emit(this.pendingDates);
      this.pendingDates = null;
      this.closed.emit();
    } else if (this.rateCalendar?.selectedCheckIn && this.rateCalendar?.selectedCheckOut) {
      this.datesSelected.emit({
        checkIn: this.rateCalendar.selectedCheckIn,
        checkOut: this.rateCalendar.selectedCheckOut
      });
      this.closed.emit();
    }
  }

  get canApply(): boolean {
    if (this.pendingDates) return true;
    return !!(this.rateCalendar?.selectedCheckIn && this.rateCalendar?.selectedCheckOut);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('sheet-backdrop')) {
      this.closed.emit();
    }
  }
}
