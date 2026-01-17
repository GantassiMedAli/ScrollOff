import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChallengeService } from '../../../core/services';
import { Challenge } from '../../../shared/models';

@Component({
  selector: 'app-challenge-detail',
  standalone: false,
  templateUrl: './challenge-detail.component.html',
  styleUrl: './challenge-detail.component.css'
})
export class ChallengeDetailComponent implements OnInit {
  challenge: Challenge | null = null;
  loading = false;
  error: string | null = null;
  
  // Progress data (would come from user's challenge progress in real app)
  daysCompleted: number = 0;
  totalDays: number = 0;
  progressPercentage: number = 0;

  // Mock leaderboard data
  leaderboard = [
    { rank: 1, name: 'Sarah Johnson', score: 100, avatar: '' },
    { rank: 2, name: 'Michael Chan', score: 98, avatar: '' },
    { rank: 3, name: 'Emily Rodriguez', score: 95, avatar: '' }
  ];

  // Mock top participants
  topParticipants = [
    { name: 'Sarah J.', daysCompleted: 7, totalDays: 7, avatar: '' },
    { name: 'Michael C.', daysCompleted: 6, totalDays: 7, avatar: '' },
    { name: 'Emily R.', daysCompleted: 7, totalDays: 7, avatar: '' },
    { name: 'James W.', daysCompleted: 5, totalDays: 7, avatar: '' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private challengeService: ChallengeService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadChallenge(parseInt(id, 10));
    } else {
      // If no ID provided, load the first/default challenge
      this.loadDefaultChallenge();
    }
  }

  loadDefaultChallenge(): void {
    this.loading = true;
    this.error = null;
    
    // Load all challenges and get the first one (or featured one)
    this.challengeService.getChallenges().subscribe({
      next: (challenges) => {
        const defaultChallenge = challenges.find(c => c.featured) || challenges[0];
        if (defaultChallenge) {
          this.challenge = defaultChallenge;
          this.totalDays = defaultChallenge.duree;
          this.daysCompleted = this.getMockProgress(defaultChallenge.id);
          this.progressPercentage = Math.round((this.daysCompleted / this.totalDays) * 100);
        } else {
          this.error = 'No challenges available.';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading challenges:', error);
        this.error = 'Failed to load challenges. Please try again later.';
        this.loading = false;
      }
    });
  }

  loadChallenge(id: number): void {
    this.loading = true;
    this.error = null;
    
    this.challengeService.getChallengeById(id).subscribe({
      next: (challenge) => {
        this.challenge = challenge;
        this.totalDays = challenge.duree;
        // Mock progress - in real app, this would come from user's progress
        this.daysCompleted = this.getMockProgress(id);
        this.progressPercentage = Math.round((this.daysCompleted / this.totalDays) * 100);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading challenge:', error);
        this.error = 'Failed to load challenge. Please try again later.';
        this.loading = false;
      }
    });
  }

  getMockProgress(challengeId: number): number {
    // Mock progress based on challenge ID
    const progressMap: { [key: number]: number } = {
      1: 5,
      2: 0,
      3: 7
    };
    return progressMap[challengeId] || 0;
  }

  getStatusText(): string {
    if (!this.challenge) return '';
    if (this.challenge.status === 'completed') return 'Completed';
    if (this.challenge.status === 'in_progress') return 'In Progress';
    return 'Not Started';
  }

  getButtonText(): string {
    if (!this.challenge) return 'Join Challenge';
    if (this.challenge.status === 'completed') return 'Completed';
    if (this.challenge.status === 'in_progress') return 'Continue Challenge';
    return 'Start Challenge';
  }

  handleChallengeAction(): void {
    if (!this.challenge) return;
    
    if (this.challenge.status === 'completed') {
      alert('You have already completed this challenge!');
      return;
    }
    
    if (this.challenge.status === 'in_progress') {
      // Navigate to challenge tracking page or show progress
      alert('Continue your challenge! (This would navigate to tracking page)');
      return;
    }
    
    // Start challenge
    alert(`Starting challenge: ${this.challenge.titre}`);
    // In real app, this would call an API to join/start the challenge
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getDifficultyBadgeClass(): string {
    if (!this.challenge) return 'badge-beginner';
    const level = this.challenge.niveau?.toLowerCase() || '';
    if (level === 'high' || level === 'hard') return 'badge-advanced';
    if (level === 'medium') return 'badge-intermediate';
    return 'badge-beginner';
  }

  getDifficultyLabel(): string {
    if (!this.challenge) return 'EASY';
    const level = this.challenge.niveau?.toLowerCase() || '';
    if (level === 'high' || level === 'hard') return 'HARD';
    if (level === 'medium') return 'MEDIUM';
    return 'EASY';
  }

  viewAllChallenges(): void {
    this.router.navigate(['/user/challenges']);
  }
}
