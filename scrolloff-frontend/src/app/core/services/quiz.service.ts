import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../../api';
import { AuthService } from '../../auth/auth.service';

export interface QuizResultPayload {
  score: number;
  niveau: string; // 'Low Risk' | 'Medium Risk' | 'High Risk'
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  constructor(
    private http: HttpClient,
    private api: Api,
    private authService: AuthService
  ) {}

  /**
   * Save quiz result to database
   */
  saveQuizResult(result: QuizResultPayload): Observable<any> {
    const token = this.authService.getToken();
    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });

    return this.http.post<any>(`${this.api.baseUrl}/results`, {
      score: result.score,
      niveau: result.niveau
    }, { headers });
  }
}
