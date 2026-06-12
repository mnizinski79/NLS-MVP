import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SearchStrategy } from '../models/search-strategy.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SearchStrategyService {
  private subject: BehaviorSubject<SearchStrategy>;
  strategy$;

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

  private parse(value: string | undefined): SearchStrategy {
    const match = (Object.values(SearchStrategy) as string[]).includes(value ?? '');
    return match ? (value as SearchStrategy) : SearchStrategy.CONCIERGE;
  }
}
