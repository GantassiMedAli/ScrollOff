import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChallengeService } from '../../../core/services';
import { Challenge } from '../../../shared/models';

@Component({
  selector: 'app-challenge-preview',
  standalone: false,
  templateUrl: './challenge-preview.component.html',
  styleUrl: './challenge-preview.component.css'
})
export class ChallengePreviewComponent implements OnInit {
  featuredChallenges: Challenge[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private challengeService: ChallengeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadFeaturedChallenges();
  }

  loadFeaturedChallenges(): void {
    this.loading = true;
    this.error = null;
    
    this.challengeService.getChallenges().subscribe({
      next: (data) => {
        // Get up to 3 featured challenges
        this.featuredChallenges = data
          .filter(c => c.featured || c.id <= 3)
          .slice(0, 3);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading challenges:', error);
        this.error = 'Failed to load challenges. Please try again later.';
        this.loading = false;
      }
    });
  }

  viewAllChallenges(): void {
    this.router.navigate(['/user/challenges']);
  }

  viewChallenge(challenge: Challenge): void {
    this.router.navigate(['/user/challenges', challenge.id]);
  }

  getDifficultyBadgeClass(challenge: Challenge): string {
    const level = challenge.niveau?.toLowerCase() || '';
    if (level === 'high' || level === 'hard') return 'badge-advanced';
    if (level === 'medium') return 'badge-intermediate';
    return 'badge-beginner';
  }

  getDifficultyLabel(challenge: Challenge): string {
    const level = challenge.niveau?.toLowerCase() || '';
    if (level === 'high' || level === 'hard') return 'HARD';
    if (level === 'medium') return 'MEDIUM';
    return 'EASY';
  }
}
