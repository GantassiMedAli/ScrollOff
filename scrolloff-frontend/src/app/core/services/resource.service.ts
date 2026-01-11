import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Api } from '../../api';
import { Resource } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  constructor(
    private http: HttpClient,
    private api: Api
  ) {}

  /**
   * Get all resources (public endpoint)
   */
  getResources(): Observable<Resource[]> {
    if (!environment.production) {
      return this.http.get<Resource[]>('/assets/resources-fallback.json');
    }

    return this.http.get<Resource[]>(`${this.api.baseUrl}/resources`).pipe(
      catchError(_ => this.http.get<Resource[]>('/assets/resources-fallback.json'))
    );
  }
}
