import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-guests-sheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="sheet-backdrop" [class.is-mobile]="isMobile" (click)="onBackdropClick($event)">
      <div class="sheet-panel" [class.is-mobile]="isMobile" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="sheet-header">
          <h3 class="sheet-title">Rooms &amp; Guests</h3>
          <button class="close-btn" (click)="closed.emit()" type="button" aria-label="Close">
            <i class="ph ph-x" aria-hidden="true"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="sheet-body">
          <!-- Adults stepper -->
          <div class="stepper-row">
            <span class="stepper-label">Adults</span>
            <div class="stepper-controls">
              <button class="stepper-btn" (click)="decrement('adults')" [disabled]="localAdults <= 1" type="button" aria-label="Decrease adults">
                <i class="ph ph-minus" aria-hidden="true"></i>
              </button>
              <span class="stepper-count">{{ localAdults }}</span>
              <button class="stepper-btn" (click)="increment('adults')" [disabled]="localAdults >= 8" type="button" aria-label="Increase adults">
                <i class="ph ph-plus" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <!-- Children stepper -->
          <div class="stepper-row">
            <span class="stepper-label">Children</span>
            <div class="stepper-controls">
              <button class="stepper-btn" (click)="decrement('children')" [disabled]="localChildren <= 0" type="button" aria-label="Decrease children">
                <i class="ph ph-minus" aria-hidden="true"></i>
              </button>
              <span class="stepper-count">{{ localChildren }}</span>
              <button class="stepper-btn" (click)="increment('children')" [disabled]="localChildren >= 6" type="button" aria-label="Increase children">
                <i class="ph ph-plus" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Done button -->
        <div class="sheet-footer">
          <button class="done-btn" (click)="onDone()" type="button">Done</button>
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
      overflow: hidden;
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
      padding: 20px;
    }

    .stepper-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
    }

    .stepper-row + .stepper-row {
      border-top: 1px solid #f3f4f6;
    }

    .stepper-label {
      font-size: 15px;
      font-weight: 500;
      color: #111827;
    }

    .stepper-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stepper-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid #d1d5db;
      background: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #374151;
      transition: all 0.15s ease;
    }

    .stepper-btn:hover:not(:disabled) {
      border-color: #9ca3af;
      background: #f9fafb;
    }

    .stepper-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .stepper-count {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      min-width: 24px;
      text-align: center;
    }

    .sheet-footer {
      padding: 16px 20px;
      border-top: 1px solid #e5e7eb;
    }

    .done-btn {
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

    .done-btn:hover {
      background: #1f2937;
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
export class GuestsSheetComponent {
  @Input() visible: boolean = false;
  @Input() adults: number = 2;
  @Input() children: number = 0;
  @Input() isMobile: boolean = false;

  @Output() closed = new EventEmitter<void>();
  @Output() guestsChanged = new EventEmitter<{adults: number, children: number}>();

  localAdults: number = 2;
  localChildren: number = 0;

  ngOnChanges(): void {
    if (this.visible) {
      this.localAdults = this.adults;
      this.localChildren = this.children;
    }
  }

  increment(type: 'adults' | 'children'): void {
    if (type === 'adults' && this.localAdults < 8) {
      this.localAdults++;
    } else if (type === 'children' && this.localChildren < 6) {
      this.localChildren++;
    }
  }

  decrement(type: 'adults' | 'children'): void {
    if (type === 'adults' && this.localAdults > 1) {
      this.localAdults--;
    } else if (type === 'children' && this.localChildren > 0) {
      this.localChildren--;
    }
  }

  onDone(): void {
    this.guestsChanged.emit({ adults: this.localAdults, children: this.localChildren });
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('sheet-backdrop')) {
      this.closed.emit();
    }
  }
}
