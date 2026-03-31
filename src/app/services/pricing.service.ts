import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PricingMode = 'cash' | 'points';

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private readonly POINTS_MULTIPLIER = 125;

  private modeSubject = new BehaviorSubject<PricingMode>('cash');
  mode$ = this.modeSubject.asObservable();

  get mode(): PricingMode {
    return this.modeSubject.value;
  }

  setMode(mode: PricingMode): void {
    this.modeSubject.next(mode);
  }

  toggleMode(): void {
    this.setMode(this.mode === 'cash' ? 'points' : 'cash');
  }

  /** Convert a cash amount to points */
  toPoints(cashAmount: number): number {
    return Math.round(cashAmount * this.POINTS_MULTIPLIER);
  }

  /** Format a nightly rate based on current mode */
  formatRate(nightlyRate: number): string {
    if (this.mode === 'points') {
      return `${this.toPoints(nightlyRate).toLocaleString()} pts`;
    }
    return `${Math.round(nightlyRate)} USD`;
  }

  /** Format just the number (no unit) */
  formatRateNumber(nightlyRate: number): string {
    if (this.mode === 'points') {
      return this.toPoints(nightlyRate).toLocaleString();
    }
    return Math.round(nightlyRate).toFixed(0);
  }

  /** Get the unit label */
  get unitLabel(): string {
    return this.mode === 'points' ? 'pts / night' : 'USD / night';
  }

  /** Get short unit */
  get unitShort(): string {
    return this.mode === 'points' ? 'pts' : 'USD';
  }
}
