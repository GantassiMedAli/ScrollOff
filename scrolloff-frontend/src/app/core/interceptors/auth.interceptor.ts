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

    // Only attach Authorization header for API requests when a token exists
    const authWasAttached = !!(token && request.url.includes('/api/'));
    let reqToHandle = request;
    if (authWasAttached) {
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
            // Only treat this as a session-expired case if we actually attached an auth header
            if (authWasAttached) {
              this.authService.logout();
              // Optionally show an informational message to the admin
              try { window.alert('Session expired. Please log in again.'); } catch(e) { /* ignore in non-browser env */ }
            } else {
              // No token was attached; it may be an anonymous endpoint or a backend misconfiguration — don't show intrusive alerts
              console.debug('[AuthInterceptor] 401 for unauthenticated request; skipping logout/alert');
            }
          } catch (e) {
            console.error('[AuthInterceptor] error while handling 401:', e);
          }
        }
        return throwError(err);
      })
    );
  }
}

