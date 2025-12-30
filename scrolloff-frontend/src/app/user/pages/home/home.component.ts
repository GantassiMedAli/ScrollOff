import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChallengeService } from '../../../core/services';
import { Challenge } from '../../../shared/models';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  challenges: Challenge[] = [];
  displayedChallenges: Challenge[] = [];
  hasMoreChallenges = false;
  loading = false;

  constructor(
    private challengeService: ChallengeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadChallenges();
  }

  loadChallenges(): void {
    this.loading = true;
    this.challengeService.getChallenges().subscribe({
      next: (data) => {
        this.challenges = data || [];
        // Display maximum 3 challenges
        this.displayedChallenges = this.challenges.slice(0, 3);
        this.hasMoreChallenges = this.challenges.length > 3;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading challenges:', error);
        this.challenges = [];
        this.displayedChallenges = [];
        this.hasMoreChallenges = false;
        this.loading = false;
      }
    });
  }

  viewAllChallenges(): void {
    this.router.navigate(['/user/challenges']);
  }
}

