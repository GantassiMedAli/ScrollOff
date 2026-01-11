import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../../api';
import { Challenge } from '../../shared/models';

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
    return this.http.get<Challenge[]>(`${this.api.baseUrl}/challenges`);
  }

  /**
   * Get challenge by ID (public endpoint)
   */
  getChallengeById(id: number): Observable<Challenge> {
    return this.http.get<Challenge>(`${this.api.baseUrl}/challenges/${id}`);
  }
}

