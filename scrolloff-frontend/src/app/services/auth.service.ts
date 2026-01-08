import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  nom: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:3000/api/auth';
  private tokenKey = 'token';
  private userKey = 'user';

  constructor(private http: HttpClient, private router: Router) {}

  register(data: { nom: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data).pipe(
      tap(response => console.log('[AuthService] register response', response))
    );
  }

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data).pipe(
      tap((response: any) => {
        if (response && response.token) {
          this.saveToken(response.token);
          if (response.user) {
            localStorage.setItem(this.userKey, JSON.stringify(response.user));
          }
        }
      })
    );
  }

  saveToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/user/login']);
  }

  getCurrentUser(): User | null {
    const data = localStorage.getItem(this.userKey);
    return data ? JSON.parse(data) : null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      if (Date.now() >= exp) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}
