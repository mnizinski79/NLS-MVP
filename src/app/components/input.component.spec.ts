import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { InputComponent } from './input.component';
import { FormsModule } from '@angular/forms';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default placeholder', () => {
    expect(component.placeholder).toBe('Ask me about hotels in NYC...');
  });

  it('should emit messageSent when valid input is submitted', fakeAsync(() => {
    let emittedMessage = '';
    component.messageSent.subscribe((message: string) => {
      emittedMessage = message;
    });

    component.inputValue = 'Test message';
    component.onSubmit();
    tick(300); // Wait for debounce

    expect(emittedMessage).toBe('Test message');
    expect(component.inputValue).toBe(''); // Input should be cleared
  }));

  it('should not emit messageSent when input is empty', fakeAsync(() => {
    let emitted = false;
    component.messageSent.subscribe(() => {
      emitted = true;
    });

    component.inputValue = '';
    component.onSubmit();
    tick(300);

    expect(emitted).toBe(false);
  }));

  it('should not emit messageSent when input is only whitespace', fakeAsync(() => {
    let emitted = false;
    component.messageSent.subscribe(() => {
      emitted = true;
    });

    component.inputValue = '   ';
    component.onSubmit();
    tick(300);

    expect(emitted).toBe(false);
  }));

  it('should not emit messageSent when disabled', fakeAsync(() => {
    let emitted = false;
    component.messageSent.subscribe(() => {
      emitted = true;
    });

    component.disabled = true;
    component.inputValue = 'Test message';
    component.onSubmit();
    tick(300);

    expect(emitted).toBe(false);
  }));

  it('should trim whitespace from input before emitting', fakeAsync(() => {
    let emittedMessage = '';
    component.messageSent.subscribe((message: string) => {
      emittedMessage = message;
    });

    component.inputValue = '  Test message  ';
    component.onSubmit();
    tick(300);

    expect(emittedMessage).toBe('Test message');
  }));

  it('should debounce rapid submissions', fakeAsync(() => {
    let emitCount = 0;
    component.messageSent.subscribe(() => {
      emitCount++;
    });

    // Submit multiple times rapidly
    component.inputValue = 'Message 1';
    component.onSubmit();
    
    tick(100);
    component.inputValue = 'Message 2';
    component.onSubmit();
    
    tick(100);
    component.inputValue = 'Message 3';
    component.onSubmit();
    
    // Wait for debounce to complete
    tick(300);

    // Only the last submission should emit
    expect(emitCount).toBe(1);
  }));

  it('should clear input after successful submission', fakeAsync(() => {
    component.inputValue = 'Test message';
    component.onSubmit();
    tick(300);

    expect(component.inputValue).toBe('');
  }));
});
