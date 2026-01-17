import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
   * Enrich challenge data with mock fields for UI
   */
  private enrichChallenge(challenge: Challenge): Challenge {
    const levelMap: { [key: string]: string } = {
      'low': 'easy',
      'medium': 'medium',
      'high': 'hard'
    };
    
    const level = challenge.niveau?.toLowerCase() || 'medium';
    const normalizedLevel = levelMap[level] || level;

    return {
      ...challenge,
      participants: challenge.participants || Math.floor(Math.random() * 3000) + 1000,
      successRate: challenge.successRate || Math.floor(Math.random() * 20) + 75,
      avgTimeSaved: challenge.avgTimeSaved || `${(Math.random() * 5 + 2).toFixed(1)}hrs`,
      status: challenge.status || 'not_started',
      progress: challenge.progress || 0,
      featured: challenge.featured !== undefined ? challenge.featured : challenge.id === 1,
      fullDescription: challenge.fullDescription || challenge.description,
      benefits: challenge.benefits || this.getDefaultBenefits(challenge.titre),
      steps: challenge.steps || this.getDefaultSteps(challenge.duree),
      image: challenge.image || '/assets/images/challenges/default-challenge.jpg'
    };
  }

  private getDefaultBenefits(title: string): string[] {
    return [
      'Better deep-quality & faster sleep onset',
      'Reduced anxiety & improved mood',
      'More time for reading & relaxation'
    ];
  }

  private getDefaultSteps(duration: number): { number: number; title: string; description: string }[] {
    return [
      {
        number: 1,
        title: 'Set Your Goal',
        description: `Choose your target and we'll remind you daily`
      },
      {
        number: 2,
        title: 'Track Daily',
        description: 'Log your progress and monitor your habits'
      },
      {
        number: 3,
        title: 'Stay Consistent',
        description: `Complete all ${duration} days to succeed`
      },
      {
        number: 4,
        title: 'Celebrate Success',
        description: 'Earn your badge and share your achievement'
      }
    ];
  }

  /**
   * Get all challenges (public endpoint)
   * Always tries API first, falls back to JSON only on error
   */
  getChallenges(): Observable<Challenge[]> {
    return this.http.get<Challenge[]>(`${this.api.baseUrl}/challenges`).pipe(
      catchError(_ => this.http.get<Challenge[]>('/assets/challenges-fallback.json')),
      map(challenges => challenges.map(c => this.enrichChallenge(c)))
    );
  }

  /**
   * Get challenge by ID (public endpoint)
   */
  getChallengeById(id: number): Observable<Challenge> {
    return this.http.get<Challenge>(`${this.api.baseUrl}/challenges/${id}`).pipe(
      catchError(_ => {
        // If API fails, try to get from all challenges
        return this.getChallenges().pipe(
          map(challenges => {
            const found = challenges.find(c => c.id === id);
            if (found) return found;
            throw new Error('Challenge not found');
          })
        );
      }),
      map(challenge => this.enrichChallenge(challenge))
    );
  }
}

