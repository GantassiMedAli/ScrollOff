import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Read token from either user token or admin token storage keys
    const token = localStorage.getItem('token') || localStorage.getItem('admin_token');

    // Attach Authorization header for API requests to the backend when token exists
    let reqToHandle = request;
    if (token && request.url.includes('/api/')) {
      console.debug('[AuthInterceptor] attaching auth header for url:', request.url);
      reqToHandle = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(reqToHandle).pipe(
      catchError((err) => {
        if (err && err.status === 401) {
          console.warn('[AuthInterceptor] 401 Unauthorized received for', request.url);
          try {
            this.authService.logout();
            // Optionally show an informational message to the admin
            try { window.alert('Session expired. Please log in again.'); } catch(e) { /* ignore in non-browser env */ }
          } catch (e) {
            console.error('[AuthInterceptor] error while handling 401:', e);
          }
        }
        return throwError(err);
      })
    );
  }
}

