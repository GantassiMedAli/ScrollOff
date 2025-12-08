import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Api {

  baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Exemple d'appel API
  getTest() {
    return this.http.get(`${this.baseUrl}/test`);
  }
}
