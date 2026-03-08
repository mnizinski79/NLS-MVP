import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private passwordProtectionEnabled = false;
  private appPassword = '';

  constructor() {
    // Check if password protection is enabled
    this.checkPasswordProtection();
  }

  /**
   * Check if password protection is enabled via environment
   * This will be set by the config service after loading
   */
  private checkPasswordProtection(): void {
    // Initially assume not authenticated if protection is enabled
    // This will be updated after config loads
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Initialize password protection settings from config
   * Called by ConfigService after loading environment variables
   */
  initializePasswordProtection(enabled: boolean, password: string): void {
    this.passwordProtectionEnabled = enabled;
    this.appPassword = password;

    // If password protection is disabled, automatically authenticate
    if (!enabled) {
      this.isAuthenticatedSubject.next(true);
    } else {
      // Check if already authenticated in session
      const sessionAuth = sessionStorage.getItem('app_authenticated');
      if (sessionAuth === 'true') {
        this.isAuthenticatedSubject.next(true);
      }
    }
  }

  /**
   * Check if password protection is enabled
   */
  isPasswordProtectionEnabled(): boolean {
    return this.passwordProtectionEnabled;
  }

  /**
   * Validate password and authenticate user
   */
  authenticate(password: string): boolean {
    if (!this.passwordProtectionEnabled) {
      this.isAuthenticatedSubject.next(true);
      return true;
    }

    if (password === this.appPassword) {
      this.isAuthenticatedSubject.next(true);
      // Store authentication in session storage
      sessionStorage.setItem('app_authenticated', 'true');
      return true;
    }

    return false;
  }

  /**
   * Get authentication status as observable
   */
  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  /**
   * Get current authentication status
   */
  isAuthenticatedValue(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Logout user (clear session)
   */
  logout(): void {
    this.isAuthenticatedSubject.next(false);
    sessionStorage.removeItem('app_authenticated');
  }
}
