import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-gate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="password-gate-overlay">
      <div class="password-gate-container">
        <div class="password-gate-content">
          <h1 class="password-gate-title">IHG Hotel Search</h1>
          <p class="password-gate-subtitle">Please enter the password to continue</p>
          
          <form (ngSubmit)="onSubmit()" class="password-form">
            <div class="input-wrapper">
              <input
                type="password"
                [(ngModel)]="passwordInput"
                name="password"
                placeholder="Enter password"
                class="password-input"
                [class.error]="showError"
                autocomplete="off"
                autofocus
              />
              <button type="submit" class="submit-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
            
            <p *ngIf="showError" class="error-message">
              Incorrect password. Please try again.
            </p>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .password-gate-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .password-gate-container {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }

    .password-gate-content {
      background: white;
      border-radius: 16px;
      padding: 48px 32px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.4s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .password-gate-title {
      font-size: 28px;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 8px 0;
      text-align: center;
    }

    .password-gate-subtitle {
      font-size: 14px;
      color: #718096;
      margin: 0 0 32px 0;
      text-align: center;
    }

    .password-form {
      width: 100%;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .password-input {
      flex: 1;
      padding: 14px 50px 14px 16px;
      font-size: 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      outline: none;
      transition: all 0.2s;
      font-family: inherit;
    }

    .password-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .password-input.error {
      border-color: #f56565;
      animation: shake 0.4s;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }

    .submit-button {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .submit-button:hover {
      background: #5568d3;
      transform: translateY(-50%) scale(1.05);
    }

    .submit-button:active {
      transform: translateY(-50%) scale(0.95);
    }

    .error-message {
      color: #f56565;
      font-size: 14px;
      margin: 8px 0 0 0;
      text-align: center;
    }

    @media (max-width: 640px) {
      .password-gate-content {
        padding: 40px 24px;
      }

      .password-gate-title {
        font-size: 24px;
      }
    }
  `]
})
export class PasswordGateComponent {
  @Output() authenticated = new EventEmitter<void>();

  passwordInput = '';
  showError = false;

  onSubmit(): void {
    // Password will be validated by parent component
    if (this.passwordInput.trim()) {
      this.authenticated.emit();
    }
  }

  setError(): void {
    this.showError = true;
    this.passwordInput = '';
    
    // Clear error after animation
    setTimeout(() => {
      this.showError = false;
    }, 3000);
  }
}
