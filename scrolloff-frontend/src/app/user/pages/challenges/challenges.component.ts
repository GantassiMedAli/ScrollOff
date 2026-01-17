import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChallengeService } from '../../../core/services';
import { Challenge } from '../../../shared/models';

@Component({
  selector: 'app-user-challenges',
  standalone: false,
  templateUrl: './challenges.component.html',
  styleUrl: './challenges.component.css'
})
export class UserChallengesComponent implements OnInit {
  challenges: Challenge[] = [];
  loading = false;
  error: string | null = null;
  
  // Filter state
  activeFilter: 'all' | 'beginner' | 'intermediate' | 'advanced' = 'all';
  searchQuery: string = '';

  // Categorized challenges
  featuredChallenge: Challenge | null = null;
  beginnerChallenges: Challenge[] = [];
  intermediateChallenges: Challenge[] = [];
  advancedChallenges: Challenge[] = [];

  constructor(
    private challengeService: ChallengeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadChallenges();
  }

  loadChallenges(): void {
    this.loading = true;
    this.error = null;
    
    this.challengeService.getChallenges().subscribe({
      next: (data) => {
        this.challenges = data || [];
        this.categorizeChallenges();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading challenges:', error);
        this.error = 'Failed to load challenges. Please try again later.';
        this.challenges = [];
        this.loading = false;
      }
    });
  }

  categorizeChallenges(): void {
    // Find featured challenge (first one or marked as featured)
    this.featuredChallenge = this.challenges.find(c => c.featured) || this.challenges[0] || null;

    // Categorize by difficulty
    this.beginnerChallenges = this.challenges.filter(c => {
      const level = c.niveau?.toLowerCase() || '';
      return level === 'low' || level === 'easy' || level === 'beginner';
    });

    this.intermediateChallenges = this.challenges.filter(c => {
      const level = c.niveau?.toLowerCase() || '';
      return level === 'medium' || level === 'intermediate';
    });

    this.advancedChallenges = this.challenges.filter(c => {
      const level = c.niveau?.toLowerCase() || '';
      return level === 'high' || level === 'hard' || level === 'advanced';
    });
  }

  setFilter(filter: 'all' | 'beginner' | 'intermediate' | 'advanced'): void {
    this.activeFilter = filter;
  }

  getFilteredChallenges(): Challenge[] {
    let filtered = [...this.challenges];

    // Apply filter
    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(c => {
        const level = c.niveau?.toLowerCase() || '';
        if (this.activeFilter === 'beginner') {
          return level === 'low' || level === 'easy' || level === 'beginner';
        }
        if (this.activeFilter === 'intermediate') {
          return level === 'medium' || level === 'intermediate';
        }
        if (this.activeFilter === 'advanced') {
          return level === 'high' || level === 'hard' || level === 'advanced';
        }
        return true;
      });
    }

    // Apply search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.titre.toLowerCase().includes(query) || 
        c.description.toLowerCase().includes(query)
      );
    }

    return filtered;
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

  getProgressPercentage(challenge: Challenge): number {
    return challenge.progress || 0;
  }
}
