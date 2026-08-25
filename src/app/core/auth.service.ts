import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { CrmApiService } from './crm-api.service';
import { AuthUser } from './models';

const STORAGE_KEYS = {
  token: 'lpc_access_token',
  user: 'lpc_user',
  role: 'lpc_role',
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly currentUser = signal<AuthUser | null>(null);
  readonly currentRole = signal<string | null>(null);
  readonly isAuthenticated = signal<boolean>(false);

  constructor(private crmApi: CrmApiService, private router: Router) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const rawUser = localStorage.getItem(STORAGE_KEYS.user);
    const role = localStorage.getItem(STORAGE_KEYS.role);

    // Antes de restaurar, valida que realmente haya datos usables (no el
    // texto literal "undefined" que quedaba guardado por el bug anterior).
    if (token && token !== 'undefined' && rawUser && rawUser !== 'undefined') {
      try {
        this.currentUser.set(JSON.parse(rawUser));
        this.currentRole.set(role);
        this.isAuthenticated.set(true);
      } catch {
        this.clearSession();
      }
    } else if (token || rawUser) {
      // Había basura guardada de una sesión rota anterior: límpiala.
      this.clearSession();
    }
  }

  get token(): string | null {
    return localStorage.getItem(STORAGE_KEYS.token);
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.crmApi.login(email, password).pipe(
      tap((response) => {
        const { access_token, user, role } = response.data;
        localStorage.setItem(STORAGE_KEYS.token, access_token);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.role, role);
        this.currentUser.set(user);
        this.currentRole.set(role);
        this.isAuthenticated.set(true);
      }),
      map((response) => response.data.user)
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.role);
    this.currentUser.set(null);
    this.currentRole.set(null);
    this.isAuthenticated.set(false);
  }
}
