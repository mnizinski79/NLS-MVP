import { TestBed } from '@angular/core/testing';
import { SearchStrategyService } from './search-strategy.service';
import { SearchStrategy } from '../models/search-strategy.model';
import { ConciergeStrategy } from '../strategies/concierge.strategy';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SearchStrategyService', () => {
  let service: SearchStrategyService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
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

describe('SearchStrategyService.current', () => {
  let service: SearchStrategyService;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SearchStrategyService);
  });
  it('returns the ConciergeStrategy instance by default', () => {
    expect(service.current()).toBeInstanceOf(ConciergeStrategy);
  });
});

describe('SearchStrategyService swap', () => {
  let service: SearchStrategyService;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SearchStrategyService);
  });

  it('current() always returns a strategy implementing planTurn/buildView', () => {
    const s = service.current();
    expect(typeof s.planTurn).toBe('function');
    expect(typeof s.buildView).toBe('function');
  });

  it('switching the flag to an unimplemented strategy does not throw (falls back to concierge)', () => {
    service.setStrategy(SearchStrategy.COMPARE);
    expect(() => service.current()).not.toThrow();
    const s = service.current();
    expect(typeof s.buildView).toBe('function');
  });
});
