import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AppConfig } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private configCache: AppConfig | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Load application configuration from server endpoint
   * Caches configuration after successful load to avoid repeated requests
   * @returns Observable of AppConfig containing API keys and settings
   * @throws Error if configuration cannot be loaded from server
   */
  loadConfig(): Observable<AppConfig> {
    if (this.configCache) {
      return of(this.configCache);
    }

    return this.http.get<AppConfig>('/api/config').pipe(
      tap(config => {
        this.configCache = config;
        
        // Initialize password protection
        const passwordProtected = config.passwordProtected === 'true' || config.passwordProtected === true;
        const appPassword = config.appPassword || '';
        this.authService.initializePasswordProtection(passwordProtected, appPassword);
      }),
      catchError(error => {
        console.error('Failed to load configuration:', error);
        // If config fails to load, disable password protection
        this.authService.initializePasswordProtection(false, '');
        return throwError(() => new Error('Failed to load application configuration. Please try again later.'));
      })
    );
  }

  /**
   * Get the cached Gemini API key
   * Returns null if configuration has not been loaded yet
   * @returns The API key string or null if not available
   */
  getApiKey(): string | null {
    return this.configCache?.geminiApiKey || null;
  }
}
