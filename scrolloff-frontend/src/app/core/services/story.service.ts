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
   * Always tries API first, falls back to JSON only on error
   */
  getStories(): Observable<Story[]> {
    return this.http.get<Story[]>(`${this.api.baseUrl}/stories`).pipe(
      catchError(_ => this.http.get<Story[]>('/assets/stories-fallback.json'))
    );
  }
}
