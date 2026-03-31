import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Hotel } from '../models/hotel.model';

export type PricingMode = 'cash' | 'points' | 'points+cash';

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

  /** Convert a cash amount to points */
  toPoints(cashAmount: number): number {
    return Math.round(cashAmount * this.POINTS_MULTIPLIER);
  }

  /** Format a nightly rate based on current mode */
  formatRate(nightlyRate: number, hotel?: Hotel): string {
    if (this.mode === 'points+cash' && hotel?.pointsCash) {
      return `${hotel.pointsCash.points.toLocaleString()} pts + $${hotel.pointsCash.cash}`;
    }
    if (this.mode === 'points') {
      return `${this.toPoints(nightlyRate).toLocaleString()} pts`;
    }
    return `${Math.round(nightlyRate)} USD`;
  }

  /** Format just the number (no unit) — for hotel cards */
  formatRateNumber(nightlyRate: number, hotel?: Hotel): string {
    if (this.mode === 'points+cash' && hotel?.pointsCash) {
      return `${hotel.pointsCash.points.toLocaleString()}`;
    }
    if (this.mode === 'points') {
      return this.toPoints(nightlyRate).toLocaleString();
    }
    return Math.round(nightlyRate).toFixed(0);
  }

  /** Get the secondary price text for points+cash mode */
  formatCashPortion(hotel?: Hotel): string | null {
    if (this.mode === 'points+cash' && hotel?.pointsCash) {
      return `+ $${hotel.pointsCash.cash}`;
    }
    return null;
  }

  /** Get the unit label */
  get unitLabel(): string {
    if (this.mode === 'points+cash') return 'pts + cash / night';
    return this.mode === 'points' ? 'pts / night' : 'USD / night';
  }

  /** Get short unit */
  get unitShort(): string {
    if (this.mode === 'points+cash') return 'pts + cash';
    return this.mode === 'points' ? 'pts' : 'USD';
  }
}
