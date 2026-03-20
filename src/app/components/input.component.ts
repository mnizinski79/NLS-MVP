import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css']
})
/**
 * InputComponent - User message input with debouncing
 *
 * Handles user text input for conversational search queries.
 * Features:
 * - Input validation (non-empty)
 * - 300ms debouncing to prevent rapid submissions
 * - Mobile keyboard optimization
 * - Disabled state during AI processing
 *
 * @example
 * <app-input
 *   [disabled]="isProcessing"
 *   [placeholder]="'Ask me about hotels...'"
 *   (messageSent)="handleMessage($event)">
 * </app-input>
 */
export class InputComponent {
  /** Whether input is disabled (e.g., during AI processing) */
  @Input() disabled: boolean = false;

  /** Placeholder text for the input field */
  @Input() placeholder: string = 'Where do you want to go...';

  /** Emitted when user submits a valid message (after debouncing) */
  @Output() messageSent = new EventEmitter<string>();

  /** Current input value */
  inputValue: string = '';

  /** Subject for debouncing input submissions */
  private inputSubject = new Subject<void>();

  constructor() {
    // Debounce input submissions with 300ms delay
    this.inputSubject.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.submitMessage();
    });
  }

  /**
   * Handle form submission
   * Triggers debounced submission via inputSubject
   * @param event - Optional form submit event
   */
  onSubmit(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    // Trigger debounced submission
    this.inputSubject.next();
  }

  /**
   * Submit message after validation
   * Only emits non-empty, trimmed messages when not disabled
   */
  private submitMessage(): void {
    const trimmedValue = this.inputValue.trim();

    // Validate non-empty input
    if (trimmedValue && !this.disabled) {
      this.messageSent.emit(trimmedValue);
      this.clearInput();
    }
  }

  /**
   * Clear the input field
   */
  clearInput(): void {
    this.inputValue = '';
  }
}
