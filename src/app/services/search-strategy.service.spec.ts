import { TestBed } from '@angular/core/testing';
import { SearchStrategyService } from './search-strategy.service';
import { SearchStrategy } from '../models/search-strategy.model';

describe('SearchStrategyService', () => {
  let service: SearchStrategyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchStrategyService);
  });

  it('defaults to CONCIERGE', () => {
    expect(service.active).toBe(SearchStrategy.CONCIERGE);
  });

  it('can switch strategy at runtime', () => {
    service.setStrategy(SearchStrategy.COMPARE);
    expect(service.active).toBe(SearchStrategy.COMPARE);
  });

  it('falls back to CONCIERGE for an unknown flag value', () => {
    service.setStrategyFromString('NONSENSE');
    expect(service.active).toBe(SearchStrategy.CONCIERGE);
  });
});
