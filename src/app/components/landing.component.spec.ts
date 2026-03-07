import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have visible input set to true by default', () => {
    expect(component.visible).toBe(true);
  });

  it('should have three example queries', () => {
    expect(component.exampleQueries).toHaveLength(3);
  });

  it('should emit dismissed event when onFirstMessage is called', () => {
    let dismissedEmitted = false;
    component.dismissed.subscribe(() => {
      dismissedEmitted = true;
    });

    component.onFirstMessage('test message');

    expect(dismissedEmitted).toBe(true);
  });

  it('should render welcome title when visible', () => {
    component.visible = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const welcomeTitle = compiled.querySelector('.welcome-title');
    expect(welcomeTitle).toBeTruthy();
    expect(welcomeTitle.textContent).toContain('Find Your Perfect Stay in NYC');
  });

  it('should render example queries', () => {
    component.visible = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const exampleButtons = compiled.querySelectorAll('.example-query');
    expect(exampleButtons.length).toBe(3);
  });

  it('should not render when visible is false', () => {
    component.visible = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const landingContainer = compiled.querySelector('.landing-container');
    expect(landingContainer).toBeFalsy();
  });
});
