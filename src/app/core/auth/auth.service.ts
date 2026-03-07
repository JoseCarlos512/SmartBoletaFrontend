import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, TokenPayload } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'sb_token';

  private _loginResponse = signal<LoginResponse | null>(this.loadFromStorage());

  readonly isAuthenticated = computed(() => !!this._loginResponse());
  readonly currentUser = computed(() => this._loginResponse());
  readonly token = computed(() => this._loginResponse()?.token ?? null);
  readonly rol = computed(() => this._loginResponse()?.rol ?? null);
  readonly tenantId = computed(() => this._loginResponse()?.tenantId ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/api/Auth/login`, request).pipe(
      tap((response) => {
        localStorage.setItem(this.TOKEN_KEY, JSON.stringify(response));
        this._loginResponse.set(response);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this._loginResponse.set(null);
    this.router.navigate(['/login']);
  }

  isTokenExpired(): boolean {
    const response = this._loginResponse();
    if (!response) return true;
    return new Date(response.expiresAt) <= new Date();
  }

  hasRole(...roles: string[]): boolean {
    const rol = this.rol();
    return rol ? roles.includes(rol) : false;
  }

  private loadFromStorage(): LoginResponse | null {
    try {
      const raw = localStorage.getItem(this.TOKEN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
