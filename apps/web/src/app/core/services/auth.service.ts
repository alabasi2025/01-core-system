import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, User, Tokens } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  
  // Signals for reactive state
  private currentUserSignal = signal<User | null>(null);
  private isLoadingSignal = signal<boolean>(false);
  
  // Computed values
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isLoading = computed(() => this.isLoadingSignal());
  readonly userPermissions = computed(() => this.currentUserSignal()?.permissions || []);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.storeTokens(response.tokens);
        this.currentUserSignal.set(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.isLoadingSignal.set(false);
      }),
      catchError(error => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post(`${this.apiUrl}/logout`, { refreshToken }).pipe(
      tap(() => this.clearAuth()),
      catchError(() => {
        this.clearAuth();
        return throwError(() => new Error('Logout failed'));
      })
    );
  }

  refreshToken(): Observable<Tokens> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<Tokens>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(tokens => this.storeTokens(tokens))
    );
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.currentUserSignal.set(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword
    });
  }

  hasPermission(permission: string): boolean {
    return this.userPermissions().includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private storeTokens(tokens: Tokens): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  private clearAuth(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSignal.set(user);
      } catch {
        this.clearAuth();
      }
    }
  }
}
