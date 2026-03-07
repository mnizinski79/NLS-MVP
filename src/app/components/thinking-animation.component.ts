import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-thinking-animation',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="visible" class="thinking-animation">
      <div class="thinking-dot"></div>
      <div class="thinking-dot"></div>
      <div class="thinking-dot"></div>
    </div>
  `,
  styles: [`
    .thinking-animation {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
    }

    .thinking-dot {
      width: 8px;
      height: 8px;
      background-color: #666;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out;
    }

    .thinking-dot:nth-child(1) {
      animation-delay: -0.32s;
    }

    .thinking-dot:nth-child(2) {
      animation-delay: -0.16s;
    }

    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
  `]
})
/**
 * ThinkingAnimationComponent - Animated dots for AI processing indicator
 *
 * Displays three animated dots with staggered bounce animation to indicate
 * AI is processing a query. Uses CSS animations for smooth, performant display.
 *
 * @example
 * <app-thinking-animation [visible]="isProcessing"></app-thinking-animation>
 */
export class ThinkingAnimationComponent {
  /** Whether the animation is visible */
  @Input() visible: boolean = false;
}
