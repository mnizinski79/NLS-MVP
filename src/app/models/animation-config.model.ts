/**
 * AnimationConfig - Configuration for transformation animations
 *
 * Defines timing and behavior for the desktop layout transformation animations.
 * All animations use GPU-accelerated properties (transform, opacity) for 60fps performance.
 */
export interface AnimationConfig {
  /** Animation duration in milliseconds (300-400ms range) */
  duration: number;
  
  /** CSS easing function */
  easing: string;
  
  /** Whether to use GPU-accelerated properties */
  useGPU: boolean;
}

/**
 * TRANSFORM_ANIMATION_CONFIG - Standard animation configuration for all transformations
 *
 * - Duration: 350ms (within 300-400ms requirement)
 * - Easing: ease-out for smooth deceleration
 * - GPU acceleration: enabled for optimal performance
 */
export const TRANSFORM_ANIMATION_CONFIG: AnimationConfig = {
  duration: 350,
  easing: 'ease-out',
  useGPU: true
};
