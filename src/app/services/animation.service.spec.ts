import { TestBed } from '@angular/core/testing';
import { AnimationService } from './animation.service';

describe('AnimationService', () => {
  let service: AnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('animateValue', () => {
    it('should animate from start to end value', (done) => {
      const values: number[] = [];
      
      service.animateValue(0, 100, { duration: 100 }).subscribe({
        next: (value) => values.push(value),
        complete: () => {
          expect(values.length).toBeGreaterThan(0);
          // First value should be close to start (within 10% due to easing)
          expect(values[0]).toBeGreaterThanOrEqual(0);
          expect(values[0]).toBeLessThan(20);
          // Last value should be close to end
          expect(values[values.length - 1]).toBeCloseTo(100, 1);
          done();
        }
      });
    });

    it('should complete animation within specified duration', (done) => {
      const startTime = performance.now();
      const duration = 200;
      
      service.animateValue(0, 100, { duration }).subscribe({
        complete: () => {
          const elapsed = performance.now() - startTime;
          expect(elapsed).toBeGreaterThanOrEqual(duration - 50); // Allow 50ms tolerance
          expect(elapsed).toBeLessThan(duration + 100); // Allow 100ms tolerance
          done();
        }
      });
    });

    it('should call onUpdate callback with progress', (done) => {
      const progressValues: number[] = [];
      
      service.animateValue(0, 100, {
        duration: 100,
        onUpdate: (progress) => progressValues.push(progress)
      }).subscribe({
        complete: () => {
          expect(progressValues.length).toBeGreaterThan(0);
          expect(progressValues[progressValues.length - 1]).toBeCloseTo(1, 1);
          done();
        }
      });
    });

    it('should call onComplete callback when animation finishes', (done) => {
      let completeCalled = false;
      
      service.animateValue(0, 100, {
        duration: 100,
        onComplete: () => completeCalled = true
      }).subscribe({
        complete: () => {
          expect(completeCalled).toBe(true);
          done();
        }
      });
    });

    it('should support custom easing function', (done) => {
      const values: number[] = [];
      
      service.animateValue(0, 100, {
        duration: 100,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Spring easing
      }).subscribe({
        next: (value) => values.push(value),
        complete: () => {
          expect(values.length).toBeGreaterThan(0);
          done();
        }
      });
    });

    it('should cancel animation on unsubscribe', (done) => {
      const values: number[] = [];
      
      const subscription = service.animateValue(0, 100, { duration: 200 }).subscribe({
        next: (value) => values.push(value)
      });
      
      setTimeout(() => {
        subscription.unsubscribe();
        const countAtUnsubscribe = values.length;
        
        setTimeout(() => {
          expect(values.length).toBe(countAtUnsubscribe);
          done();
        }, 100);
      }, 50);
    });
  });

  describe('animateMapPan', () => {
    let mockMap: any;

    beforeEach(() => {
      mockMap = {
        getCenter: jest.fn().mockReturnValue({
          lat: () => 0,
          lng: () => 0
        }),
        setCenter: jest.fn()
      };
    });

    it('should animate map center to target position', (done) => {
      const targetCenter = { lat: 10, lng: 20 };
      
      service.animateMapPan(mockMap, targetCenter, 100).subscribe({
        complete: () => {
          expect(mockMap.setCenter).toHaveBeenCalled();
          const calls = mockMap.setCenter.mock.calls;
          const lastCall = calls[calls.length - 1][0];
          expect(lastCall.lat).toBeCloseTo(targetCenter.lat, 1);
          expect(lastCall.lng).toBeCloseTo(targetCenter.lng, 1);
          done();
        }
      });
    });

    it('should use default duration of 350ms', (done) => {
      const startTime = performance.now();
      const targetCenter = { lat: 10, lng: 20 };
      
      service.animateMapPan(mockMap, targetCenter).subscribe({
        complete: () => {
          const elapsed = performance.now() - startTime;
          expect(elapsed).toBeGreaterThanOrEqual(300); // Allow tolerance
          expect(elapsed).toBeLessThan(450);
          done();
        }
      });
    });

    it('should handle missing map center gracefully', (done) => {
      mockMap.getCenter.mockReturnValue(null);
      const targetCenter = { lat: 10, lng: 20 };
      
      service.animateMapPan(mockMap, targetCenter).subscribe({
        error: (error) => {
          expect(error.message).toContain('Map center not available');
          done();
        }
      });
    });
  });

  describe('animateSheetHeight', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement('div');
      element.style.height = '100px';
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.removeChild(element);
    });

    it('should animate element height to target', (done) => {
      const targetHeight = 500;
      
      service.animateSheetHeight(element, targetHeight).subscribe({
        complete: () => {
          expect(element.style.height).toBe(`${targetHeight}px`);
          done();
        }
      });
    });

    it('should use spring easing when requested', (done) => {
      const targetHeight = 500;
      
      service.animateSheetHeight(element, targetHeight, true).subscribe({
        complete: () => {
          expect(element.style.height).toBe(`${targetHeight}px`);
          done();
        }
      });
    });

    it('should use default easing when spring not requested', (done) => {
      const targetHeight = 500;
      
      service.animateSheetHeight(element, targetHeight, false).subscribe({
        complete: () => {
          expect(element.style.height).toBe(`${targetHeight}px`);
          done();
        }
      });
    });
  });

  describe('animation cancellation', () => {
    it('should track active animations', (done) => {
      expect(service.getActiveAnimationCount()).toBe(0);
      
      const subscription = service.animateValue(0, 100, { duration: 200 }).subscribe();
      
      setTimeout(() => {
        expect(service.getActiveAnimationCount()).toBeGreaterThan(0);
        subscription.unsubscribe();
        
        setTimeout(() => {
          expect(service.getActiveAnimationCount()).toBe(0);
          done();
        }, 50);
      }, 50);
    });

    it('should cancel all active animations', (done) => {
      const sub1 = service.animateValue(0, 100, { duration: 300 }).subscribe();
      const sub2 = service.animateValue(0, 100, { duration: 300 }).subscribe();
      
      setTimeout(() => {
        expect(service.getActiveAnimationCount()).toBe(2);
        service.cancelAllAnimations();
        expect(service.getActiveAnimationCount()).toBe(0);
        done();
      }, 50);
    });

    it('should allow cancellation of animations in progress', (done) => {
      let completed = false;
      
      service.animateValue(0, 100, {
        duration: 300,
        onComplete: () => completed = true
      }).subscribe();
      
      setTimeout(() => {
        service.cancelAllAnimations();
        
        setTimeout(() => {
          expect(completed).toBe(false);
          done();
        }, 200);
      }, 50);
    });
  });
});
