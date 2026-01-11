import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Api } from '../../api';
import { Story } from '../../shared/models';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class StoryService {
  constructor(
    private http: HttpClient,
    private api: Api
  ) {}

  /**
   * Get all approved stories (public endpoint)
   */
  getStories(): Observable<Story[]> {
    // In development, serve the local fallback asset directly to prevent 404 network errors
    if (!environment.production) {
      return this.http.get<Story[]>('/assets/stories-fallback.json');
    }

    return this.http.get<Story[]>(`${this.api.baseUrl}/stories`).pipe(
      catchError(_ => this.http.get<Story[]>('/assets/stories-fallback.json'))
    );
  }
}
