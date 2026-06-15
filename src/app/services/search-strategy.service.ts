import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SearchStrategy } from '../models/search-strategy.model';
import { ISearchStrategy } from '../strategies/search-strategy.interface';
import { ConciergeStrategy } from '../strategies/concierge.strategy';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SearchStrategyService {
  private subject: BehaviorSubject<SearchStrategy>;
  strategy$: Observable<SearchStrategy>;

  private concierge = inject(ConciergeStrategy);

  constructor() {
    this.subject = new BehaviorSubject<SearchStrategy>(this.parse(environment.searchStrategy));
    this.strategy$ = this.subject.asObservable();
  }

  get active(): SearchStrategy {
    return this.subject.value;
  }

  setStrategy(strategy: SearchStrategy): void {
    this.subject.next(strategy);
  }

  setStrategyFromString(value: string): void {
    this.subject.next(this.parse(value));
  }

  /** Resolve the active strategy object. New strategies register here later. */
  current(): ISearchStrategy {
    switch (this.active) {
      case SearchStrategy.CONCIERGE:
      default:
        return this.concierge;
    }
  }

  private parse(value: string | undefined): SearchStrategy {
    const match = (Object.values(SearchStrategy) as string[]).includes(value ?? '');
    return match ? (value as SearchStrategy) : SearchStrategy.CONCIERGE;
  }
}
