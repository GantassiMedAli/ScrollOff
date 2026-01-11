import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Api } from '../api';

export interface Admin {
  id: number;
  username: string;
}

export interface LoginResponse {
  token: string;
  admin: Admin;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'admin_token';
  private adminKey = 'admin_data';
  private adminSubject = new BehaviorSubject<Admin | null>(this.getAdminFromStorage());
  public admin$ = this.adminSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private api: Api
  ) { }

  /**
   * Admin login
   */
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api.baseUrl}/admin/login`, {
      username,
      password
    }).pipe(
      tap(response => {
        console.log('[AuthService] Login successful — token received:', response.token ? `${response.token.slice(0,10)}...` : null);        // Remove any old token first to avoid race with expired tokens
        try { localStorage.removeItem(this.tokenKey); } catch(e) { /* ignore */ }        this.setToken(response.token);
        this.setAdmin(response.admin);
        this.adminSubject.next(response.admin);
      })
    );
  }

  /**
   * Admin logout
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.adminKey);
    console.log('[AuthService] Token and admin data cleared from localStorage');
    this.adminSubject.next(null);
    // Only navigate if we're not already at the admin login to prevent navigation loops
    try {
      if (!this.router.url.startsWith('/auth/admin-login')) {
        this.router.navigate(['/auth/admin-login']);
      }
    } catch (e) {
      // Router may not be available in some test environments
      const errMsg = e instanceof Error ? e.message : String(e);
      console.debug('[AuthService] logout navigate skipped:', errMsg);
    }
  }

  /**
   * Get current JWT token
   */
  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    console.debug('[AuthService] getToken ->', token ? `present (${token.slice(0,10)}...)` : 'none');
    return token;
  }

  /**
   * Check if admin is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      if (Date.now() >= expirationTime) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current admin
   */
  getCurrentAdmin(): Admin | null {
    return this.adminSubject.value;
  }

  /**
   * Set JWT token in localStorage
   */
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    console.log('[AuthService] Token stored in localStorage:', token ? `${token.slice(0,10)}...` : null);
  }

  /**
   * Set admin data in localStorage
   */
  private setAdmin(admin: Admin): void {
    localStorage.setItem(this.adminKey, JSON.stringify(admin));
  }

  /**
   * Get admin from localStorage
   */
  private getAdminFromStorage(): Admin | null {
    const adminData = localStorage.getItem(this.adminKey);
    return adminData ? JSON.parse(adminData) : null;
  }
}

