import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from './input.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, InputComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
/**
 * LandingComponent - Full-screen landing page
 *
 * Displays the initial landing view before first search with:
 * - Full-screen background image
 * - Semi-transparent header (50% opacity)
 * - Welcome message with example queries
 * - Semi-transparent input bar (50% opacity)
 * - Smooth fade-out transition on first message
 *
 * @example
 * <app-landing
 *   [visible]="showLanding"
 *   (dismissed)="handleLandingDismissed()">
 * </app-landing>
 */
export class LandingComponent {
  /** Whether the landing page is visible */
  @Input() visible: boolean = true;

  /** Emitted when landing is dismissed (first message sent) */
  @Output() dismissed = new EventEmitter<void>();
  
  /** Emitted when user sends first message */
  @Output() messageSent = new EventEmitter<string>();

  /** Example queries to display in welcome box */
  exampleQueries: string[] = [
    'Show me luxury hotels in Midtown',
    'Find pet-friendly hotels with a rooftop bar',
    'What are the cheapest options near Times Square?'
  ];

  /**
   * Handle first message submission
   * Dismisses landing page and passes message to parent
   * @param message - User's first query
   */
  onFirstMessage(message: string): void {
    // Emit message first, then dismiss
    this.messageSent.emit(message);
    this.dismissed.emit();
  }
}
