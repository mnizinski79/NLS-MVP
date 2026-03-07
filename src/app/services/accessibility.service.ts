import { Injectable } from '@angular/core';

export interface FocusState {
  previousElement: HTMLElement | null;
  currentElement: HTMLElement | null;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private focusState: FocusState = {
    previousElement: null,
    currentElement: null
  };
  
  private ariaLiveRegion: HTMLElement | null = null;
  private readonly FOCUS_RETRY_DELAY = 100;
  private readonly MAX_FOCUS_RETRIES = 3;

  constructor() {
    // Delay initialization to ensure document.body is available
    if (typeof document !== 'undefined' && document.body) {
      this.initializeAriaLiveRegion();
    }
  }

  /**
   * Initialize aria-live region for screen reader announcements
   * Creates a visually hidden element that screen readers can access
   */
  private initializeAriaLiveRegion(): void {
    // Check if region already exists
    let region = document.getElementById('aria-live-region');
    
    if (!region) {
      region = document.createElement('div');
      region.id = 'aria-live-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      
      // Visually hidden but accessible to screen readers
      region.style.position = 'absolute';
      region.style.left = '-10000px';
      region.style.width = '1px';
      region.style.height = '1px';
      region.style.overflow = 'hidden';
      
      if (document.body) {
        document.body.appendChild(region);
      }
    }
    
    this.ariaLiveRegion = region;
  }

  /**
   * Announce message to screen readers
   * @param message - Text to announce
   * @param priority - 'polite' waits for current speech, 'assertive' interrupts
   */
  announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.ariaLiveRegion) {
      this.initializeAriaLiveRegion();
    }
    
    if (!this.ariaLiveRegion) {
      console.warn('Aria-live region not available for announcement');
      return;
    }
    
    // Update aria-live attribute based on priority
    this.ariaLiveRegion.setAttribute('aria-live', priority);
    
    // Clear previous message first to ensure new message is announced
    this.ariaLiveRegion.textContent = '';
    
    // Use setTimeout to ensure screen readers detect the change
    setTimeout(() => {
      if (this.ariaLiveRegion) {
        this.ariaLiveRegion.textContent = message;
      }
    }, 100);
  }

  /**
   * Move focus to the bottom sheet element
   * Retries if element is not yet rendered
   * @param sheetElement - The bottom sheet element to focus
   */
  moveFocusToSheet(sheetElement: HTMLElement): void {
    // Store previous focus before moving
    this.focusState.previousElement = document.activeElement as HTMLElement;
    
    this.attemptFocus(sheetElement, 0);
  }

  /**
   * Attempt to focus element with retry logic
   * @param element - Element to focus
   * @param attemptCount - Current attempt number
   */
  private attemptFocus(element: HTMLElement, attemptCount: number): void {
    if (attemptCount >= this.MAX_FOCUS_RETRIES) {
      console.error('Failed to move focus after maximum retries');
      return;
    }
    
    // Check if element is focusable
    if (!element || !document.body.contains(element)) {
      // Element not yet rendered, retry
      setTimeout(() => {
        this.attemptFocus(element, attemptCount + 1);
      }, this.FOCUS_RETRY_DELAY);
      return;
    }
    
    // Ensure element is focusable
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
    }
    
    element.focus();
    this.focusState.currentElement = element;
  }

  /**
   * Restore focus to previously focused element
   * Falls back to body if previous element is not available
   */
  restoreFocus(): void {
    if (this.focusState.previousElement && document.body.contains(this.focusState.previousElement)) {
      this.focusState.previousElement.focus();
    } else if (document.body) {
      // Fallback to body if previous element is not available
      // Make body focusable if it isn't already
      if (!document.body.hasAttribute('tabindex')) {
        document.body.setAttribute('tabindex', '-1');
      }
      document.body.focus();
    }
    
    // Clear focus state
    this.focusState.currentElement = null;
    this.focusState.previousElement = null;
  }

  /**
   * Set up keyboard navigation handlers for bottom sheet
   * @param sheetElement - The bottom sheet element
   * @param onEscape - Callback to execute when Escape key is pressed
   */
  setupKeyboardHandlers(sheetElement: HTMLElement, onEscape: () => void): void {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
        return;
      }
      
      // Handle Tab key for focus trap
      if (event.key === 'Tab') {
        this.handleTabNavigation(event, sheetElement);
      }
    };
    
    sheetElement.addEventListener('keydown', handleKeyDown);
    
    // Store handler for cleanup
    (sheetElement as any)._keydownHandler = handleKeyDown;
  }

  /**
   * Handle Tab key navigation within bottom sheet
   * Creates a focus trap to keep focus within the sheet
   * @param event - Keyboard event
   * @param sheetElement - The bottom sheet element
   */
  private handleTabNavigation(event: KeyboardEvent, sheetElement: HTMLElement): void {
    const focusableElements = this.getFocusableElements(sheetElement);
    
    if (focusableElements.length === 0) {
      return;
    }
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // If shift+tab on first element, move to last
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }
    
    // If tab on last element, move to first
    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
      return;
    }
  }

  /**
   * Get all focusable elements within a container
   * @param container - Container element to search within
   * @returns Array of focusable elements
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    
    const elements = container.querySelectorAll(focusableSelectors);
    return Array.from(elements) as HTMLElement[];
  }

  /**
   * Remove keyboard handlers from bottom sheet
   * @param sheetElement - The bottom sheet element
   */
  removeKeyboardHandlers(sheetElement: HTMLElement): void {
    const handler = (sheetElement as any)._keydownHandler;
    if (handler) {
      sheetElement.removeEventListener('keydown', handler);
      delete (sheetElement as any)._keydownHandler;
    }
  }

  /**
   * Get current focus state
   * @returns Current focus state
   */
  getFocusState(): FocusState {
    return { ...this.focusState };
  }
}
