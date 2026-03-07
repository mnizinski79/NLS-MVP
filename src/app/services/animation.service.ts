import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface AnimationConfig {
  duration: number;
  easing: string;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

interface ActiveAnimation {
  id: number;
  cancel: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private readonly DEFAULT_DURATION = 350;
  private readonly DEFAULT_EASING = 'cubic-bezier(0.4, 0.0, 0.2, 1)';
  private readonly SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  
  private activeAnimations: Map<number, ActiveAnimation> = new Map();
  private nextAnimationId = 0;

  /**
   * Animates a value from start to end using requestAnimationFrame
   * Supports cubic-bezier and spring easing functions
   */
  animateValue(
    from: number,
    to: number,
    config: Partial<AnimationConfig> = {}
  ): Observable<number> {
    const duration = config.duration ?? this.DEFAULT_DURATION;
    const easing = config.easing ?? this.DEFAULT_EASING;
    
    return new Observable<number>(observer => {
      const startTime = performance.now();
      let animationFrameId: number;
      let cancelled = false;
      
      const animationId = this.nextAnimationId++;
      
      const animate = (currentTime: number) => {
        if (cancelled) {
          observer.complete();
          return;
        }
        
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Apply easing function
        const easedProgress = this.applyEasing(progress, easing);
        
        // Calculate current value
        const currentValue = from + (to - from) * easedProgress;
        
        // Emit current value
        observer.next(currentValue);
        
        // Call onUpdate callback if provided
        if (config.onUpdate) {
          config.onUpdate(easedProgress);
        }
        
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          // Animation complete
          if (config.onComplete) {
            config.onComplete();
          }
          this.activeAnimations.delete(animationId);
          observer.complete();
        }
      };
      
      animationFrameId = requestAnimationFrame(animate);
      
      // Store animation for cancellation support
      this.activeAnimations.set(animationId, {
        id: animationId,
        cancel: () => {
          cancelled = true;
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
          this.activeAnimations.delete(animationId);
        }
      });
      
      // Cleanup on unsubscribe
      return () => {
        cancelled = true;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        this.activeAnimations.delete(animationId);
      };
    });
  }

  /**
   * Apply easing function to progress value
   * Supports cubic-bezier and spring easing
   */
  private applyEasing(progress: number, easing: string): number {
    // Parse cubic-bezier values
    if (easing.startsWith('cubic-bezier')) {
      const match = easing.match(/cubic-bezier\(([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/);
      if (match) {
        const [, x1, y1, x2, y2] = match.map(Number);
        return this.cubicBezier(progress, x1, y1, x2, y2);
      }
    }
    
    // Fallback to linear
    return progress;
  }

  /**
   * Cubic bezier easing calculation
   * Simplified implementation for common easing curves
   */
  private cubicBezier(t: number, x1: number, y1: number, x2: number, y2: number): number {
    // Simplified cubic bezier calculation
    // For production, consider using a library like bezier-easing
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    
    // Calculate bezier curve value
    const tSquared = t * t;
    const tCubed = tSquared * t;
    
    return ay * tCubed + by * tSquared + cy * t;
  }

  /**
   * Animate Google Maps pan to target center
   * Uses 350ms duration with default easing
   */
  animateMapPan(
    map: any,
    targetCenter: { lat: number; lng: number },
    duration: number = this.DEFAULT_DURATION
  ): Observable<void> {
    return new Observable<void>(observer => {
      const startCenter = map.getCenter();
      if (!startCenter) {
        observer.error(new Error('Map center not available'));
        return;
      }
      
      const startLat = startCenter.lat();
      const startLng = startCenter.lng();
      
      const subscription = this.animateValue(0, 1, {
        duration,
        easing: this.DEFAULT_EASING,
        onUpdate: (progress) => {
          const currentLat = startLat + (targetCenter.lat - startLat) * progress;
          const currentLng = startLng + (targetCenter.lng - startLng) * progress;
          
          map.setCenter({ lat: currentLat, lng: currentLng });
        },
        onComplete: () => {
          observer.next();
          observer.complete();
        }
      }).subscribe();
      
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Animate bottom sheet height
   * Supports optional spring easing for natural feel
   */
  animateSheetHeight(
    element: HTMLElement,
    targetHeight: number,
    useSpring: boolean = false
  ): Observable<void> {
    return new Observable<void>(observer => {
      const startHeight = element.offsetHeight;
      const easing = useSpring ? this.SPRING_EASING : this.DEFAULT_EASING;
      
      const subscription = this.animateValue(startHeight, targetHeight, {
        duration: this.DEFAULT_DURATION,
        easing,
        onUpdate: (progress) => {
          const currentHeight = startHeight + (targetHeight - startHeight) * progress;
          element.style.height = `${currentHeight}px`;
        },
        onComplete: () => {
          observer.next();
          observer.complete();
        }
      }).subscribe();
      
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Cancel all active animations
   */
  cancelAllAnimations(): void {
    this.activeAnimations.forEach(animation => animation.cancel());
    this.activeAnimations.clear();
  }

  /**
   * Cancel a specific animation by id
   */
  cancelAnimation(animationId: number): void {
    const animation = this.activeAnimations.get(animationId);
    if (animation) {
      animation.cancel();
    }
  }

  /**
   * Get count of active animations
   */
  getActiveAnimationCount(): number {
    return this.activeAnimations.size;
  }
}
