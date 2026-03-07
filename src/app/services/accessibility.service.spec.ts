import { TestBed } from '@angular/core/testing';
import { AccessibilityService } from './accessibility.service';

describe('AccessibilityService', () => {
  let service: AccessibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    
    // Clean up any existing aria-live regions
    const existingRegion = document.getElementById('aria-live-region');
    if (existingRegion) {
      existingRegion.remove();
    }
    
    service = TestBed.inject(AccessibilityService);
  });

  afterEach(() => {
    // Clean up aria-live region after each test
    const region = document.getElementById('aria-live-region');
    if (region) {
      region.remove();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Screen Reader Announcements', () => {
    it('should create aria-live region when first announcement is made', (done) => {
      service.announceToScreenReader('Test', 'polite');
      
      setTimeout(() => {
        const region = document.getElementById('aria-live-region');
        expect(region).toBeTruthy();
        expect(region?.getAttribute('role')).toBe('status');
        expect(region?.getAttribute('aria-live')).toBe('polite');
        done();
      }, 150);
    });

    it('should announce message with polite priority', (done) => {
      const message = 'Test announcement';
      service.announceToScreenReader(message, 'polite');
      
      setTimeout(() => {
        const region = document.getElementById('aria-live-region');
        expect(region?.textContent).toBe(message);
        expect(region?.getAttribute('aria-live')).toBe('polite');
        done();
      }, 150);
    });

    it('should announce message with assertive priority', (done) => {
      const message = 'Urgent announcement';
      service.announceToScreenReader(message, 'assertive');
      
      setTimeout(() => {
        const region = document.getElementById('aria-live-region');
        expect(region?.textContent).toBe(message);
        expect(region?.getAttribute('aria-live')).toBe('assertive');
        done();
      }, 150);
    });

    it('should clear previous message before announcing new one', (done) => {
      service.announceToScreenReader('First message', 'polite');
      
      setTimeout(() => {
        service.announceToScreenReader('Second message', 'polite');
        
        setTimeout(() => {
          const region = document.getElementById('aria-live-region');
          expect(region?.textContent).toBe('Second message');
          done();
        }, 150);
      }, 150);
    });
  });

  describe('Focus Management', () => {
    it('should move focus to sheet element', () => {
      const sheetElement = document.createElement('div');
      document.body.appendChild(sheetElement);
      
      service.moveFocusToSheet(sheetElement);
      
      expect(document.activeElement).toBe(sheetElement);
      expect(sheetElement.getAttribute('tabindex')).toBe('-1');
      
      document.body.removeChild(sheetElement);
    });

    it('should store previous focus before moving', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();
      
      const sheetElement = document.createElement('div');
      document.body.appendChild(sheetElement);
      
      service.moveFocusToSheet(sheetElement);
      
      const focusState = service.getFocusState();
      expect(focusState.previousElement).toBe(button);
      expect(focusState.currentElement).toBe(sheetElement);
      
      document.body.removeChild(button);
      document.body.removeChild(sheetElement);
    });

    it('should restore focus to previous element', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();
      
      const sheetElement = document.createElement('div');
      document.body.appendChild(sheetElement);
      
      service.moveFocusToSheet(sheetElement);
      service.restoreFocus();
      
      expect(document.activeElement).toBe(button);
      
      document.body.removeChild(button);
      document.body.removeChild(sheetElement);
    });

    it('should fallback to body if previous element is removed', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();
      
      const sheetElement = document.createElement('div');
      document.body.appendChild(sheetElement);
      
      service.moveFocusToSheet(sheetElement);
      document.body.removeChild(button);
      service.restoreFocus();
      
      // Body should be focused and have tabindex
      expect(document.activeElement).toBe(document.body);
      expect(document.body.getAttribute('tabindex')).toBe('-1');
      
      document.body.removeChild(sheetElement);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call onEscape callback when Escape key is pressed', () => {
      const sheetElement = document.createElement('div');
      document.body.appendChild(sheetElement);
      
      let escapeCalled = false;
      const onEscape = () => { escapeCalled = true; };
      
      service.setupKeyboardHandlers(sheetElement, onEscape);
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      sheetElement.dispatchEvent(event);
      
      expect(escapeCalled).toBe(true);
      
      service.removeKeyboardHandlers(sheetElement);
      document.body.removeChild(sheetElement);
    });

    it('should trap focus within sheet on Tab key', () => {
      const sheetElement = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      
      sheetElement.appendChild(button1);
      sheetElement.appendChild(button2);
      document.body.appendChild(sheetElement);
      
      service.setupKeyboardHandlers(sheetElement, () => {});
      
      button2.focus();
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      Object.defineProperty(event, 'shiftKey', { value: false });
      sheetElement.dispatchEvent(event);
      
      // Focus should wrap to first element
      expect(document.activeElement).toBe(button1);
      
      service.removeKeyboardHandlers(sheetElement);
      document.body.removeChild(sheetElement);
    });

    it('should remove keyboard handlers', () => {
      const sheetElement = document.createElement('div');
      document.body.appendChild(sheetElement);
      
      let escapeCalled = false;
      const onEscape = () => { escapeCalled = true; };
      
      service.setupKeyboardHandlers(sheetElement, onEscape);
      service.removeKeyboardHandlers(sheetElement);
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      sheetElement.dispatchEvent(event);
      
      expect(escapeCalled).toBe(false);
      
      document.body.removeChild(sheetElement);
    });
  });
});
