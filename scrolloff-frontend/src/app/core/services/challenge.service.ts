import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Api } from '../../api';
import { Challenge } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  constructor(
    private http: HttpClient,
    private api: Api
  ) {}

  /**
   * Get all challenges (public endpoint)
   */
  getChallenges(): Observable<Challenge[]> {
    if (!environment.production) {
      return this.http.get<Challenge[]>('/assets/challenges-fallback.json');
    }

    return this.http.get<Challenge[]>(`${this.api.baseUrl}/challenges`).pipe(
      catchError(_ => this.http.get<Challenge[]>('/assets/challenges-fallback.json'))
    );
  }

  /**
   * Get challenge by ID (public endpoint)
   */
  getChallengeById(id: number): Observable<Challenge> {
    return this.http.get<Challenge>(`${this.api.baseUrl}/challenges/${id}`);
  }
}

