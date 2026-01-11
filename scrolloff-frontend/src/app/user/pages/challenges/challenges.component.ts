import { Component, OnInit } from '@angular/core';
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
  selectedChallenge: Challenge | null = null;
  loading = false;
  error: string | null = null;
  showModal = false;

  constructor(private challengeService: ChallengeService) { }

  ngOnInit(): void {
    this.loadChallenges();
  }

  loadChallenges(): void {
    this.loading = true;
    this.error = null;
    this.challengeService.getChallenges().subscribe({
      next: (data) => {
        this.challenges = data || [];
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

  openChallengeDetail(challenge: Challenge): void {
    this.selectedChallenge = challenge;
    this.showModal = true;
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedChallenge = null;
    document.body.style.overflow = '';
  }

  joinChallenge(): void {
    // Placeholder for join challenge functionality
    alert('Challenge join functionality will be implemented soon!');
    this.closeModal();
  }

  getLevelClass(niveau: string): string {
    const level = niveau?.toLowerCase() || '';
    if (level === 'high') return 'level-high';
    if (level === 'medium') return 'level-medium';
    return 'level-low';
  }

  getLevelLabel(niveau: string): string {
    const level = niveau?.toLowerCase() || '';
    return level.charAt(0).toUpperCase() + level.slice(1);
  }
}
