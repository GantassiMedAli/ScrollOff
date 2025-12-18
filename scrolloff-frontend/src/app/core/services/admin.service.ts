import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../../api';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(
    private http: HttpClient,
    private api: Api,
    private authService: AuthService
  ) {}

  /**
   * Get authorization headers
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== STATISTICS ====================

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.api.baseUrl}/admin/stats`, {
      headers: this.getHeaders()
    });
  }

  // ==================== USERS ====================

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api.baseUrl}/admin/users`, {
      headers: this.getHeaders()
    });
  }

  updateUserStatus(id: number, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.api.baseUrl}/admin/users/${id}`, {
      is_active: isActive
    }, {
      headers: this.getHeaders()
    });
  }

  // ==================== RESULTS ====================

  getResultsStats(): Observable<any> {
    return this.http.get(`${this.api.baseUrl}/admin/results/stats`, {
      headers: this.getHeaders()
    });
  }

  // ==================== STORIES ====================

  getStories(statut?: string): Observable<any[]> {
    const url = statut
      ? `${this.api.baseUrl}/admin/stories?statut=${statut}`
      : `${this.api.baseUrl}/admin/stories`;
    return this.http.get<any[]>(url, {
      headers: this.getHeaders()
    });
  }

  updateStoryStatus(id: number, statut: 'pending' | 'approved' | 'rejected'): Observable<any> {
    return this.http.patch(`${this.api.baseUrl}/admin/stories/${id}`, {
      statut
    }, {
      headers: this.getHeaders()
    });
  }

  deleteStory(id: number): Observable<any> {
    return this.http.delete(`${this.api.baseUrl}/admin/stories/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== TIPS ====================

  getTips(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api.baseUrl}/admin/tips`, {
      headers: this.getHeaders()
    });
  }

  getTip(id: number): Observable<any> {
    return this.http.get<any>(`${this.api.baseUrl}/admin/tips/${id}`, {
      headers: this.getHeaders()
    });
  }

  createTip(tip: { titre: string; contenu: string; niveau: string }): Observable<any> {
    return this.http.post(`${this.api.baseUrl}/admin/tips`, tip, {
      headers: this.getHeaders()
    });
  }

  updateTip(id: number, tip: { titre: string; contenu: string; niveau: string }): Observable<any> {
    return this.http.put(`${this.api.baseUrl}/admin/tips/${id}`, tip, {
      headers: this.getHeaders()
    });
  }

  deleteTip(id: number): Observable<any> {
    return this.http.delete(`${this.api.baseUrl}/admin/tips/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== RESOURCES ====================

  getResources(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api.baseUrl}/admin/resources`, {
      headers: this.getHeaders()
    });
  }

  getResource(id: number): Observable<any> {
    return this.http.get<any>(`${this.api.baseUrl}/admin/resources/${id}`, {
      headers: this.getHeaders()
    });
  }

  createResource(resource: { titre: string; description: string; lien: string; type: string }): Observable<any> {
    return this.http.post(`${this.api.baseUrl}/admin/resources`, resource, {
      headers: this.getHeaders()
    });
  }

  updateResource(id: number, resource: { titre: string; description: string; lien: string; type: string }): Observable<any> {
    return this.http.put(`${this.api.baseUrl}/admin/resources/${id}`, resource, {
      headers: this.getHeaders()
    });
  }

  deleteResource(id: number): Observable<any> {
    return this.http.delete(`${this.api.baseUrl}/admin/resources/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ==================== CHALLENGES ====================

  getChallenges(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api.baseUrl}/admin/challenges`, {
      headers: this.getHeaders()
    });
  }

  getChallenge(id: number): Observable<any> {
    return this.http.get<any>(`${this.api.baseUrl}/admin/challenges/${id}`, {
      headers: this.getHeaders()
    });
  }

  createChallenge(challenge: { titre: string; description: string; niveau: string; duree: number }): Observable<any> {
    return this.http.post(`${this.api.baseUrl}/admin/challenges`, challenge, {
      headers: this.getHeaders()
    });
  }

  updateChallenge(id: number, challenge: { titre: string; description: string; niveau: string; duree: number }): Observable<any> {
    return this.http.put(`${this.api.baseUrl}/admin/challenges/${id}`, challenge, {
      headers: this.getHeaders()
    });
  }

  deleteChallenge(id: number): Observable<any> {
    return this.http.delete(`${this.api.baseUrl}/admin/challenges/${id}`, {
      headers: this.getHeaders()
    });
  }
}

