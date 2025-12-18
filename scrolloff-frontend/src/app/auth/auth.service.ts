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
        this.setToken(response.token);
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
    this.adminSubject.next(null);
    this.router.navigate(['/auth/admin-login']);
  }

  /**
   * Get current JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
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

