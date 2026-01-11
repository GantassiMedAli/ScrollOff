import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Api } from '../../api';
import { Tip } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TipService {
  constructor(
    private http: HttpClient,
    private api: Api
  ) {}

  /**
   * Get all tips (public endpoint)
   */
  getTips(): Observable<Tip[]> {
    if (!environment.production) {
      return this.http.get<Tip[]>('/assets/tips-fallback.json');
    }

    return this.http.get<Tip[]>(`${this.api.baseUrl}/tips`).pipe(
      catchError(_ => this.http.get<Tip[]>('/assets/tips-fallback.json'))
    );
  }
}
