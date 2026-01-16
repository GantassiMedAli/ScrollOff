import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChallengeService } from '../../../core/services';
import { Challenge } from '../../../shared/models';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit {
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

  ngAfterViewInit(): void {
    // Carousel initialization moved to after challenges load
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
        
        // Initialize carousel after challenges are loaded
        setTimeout(() => this.initializeCarousel(), 500);
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

  getCarouselSlides(): Challenge[][] {
    const slides: Challenge[][] = [];
    const challengesPerSlide = 3;

    for (let i = 0; i < this.displayedChallenges.length; i += challengesPerSlide) {
      slides.push(this.displayedChallenges.slice(i, i + challengesPerSlide));
    }

    return slides;
  }

  private initializeCarousel(): void {
    // Wait for DOM to be ready and challenges to be loaded
    setTimeout(() => {
      const carouselElement = document.getElementById('challengesCarousel');
      if (carouselElement && this.displayedChallenges.length > 3) {
        // Initialize Bootstrap carousel
        const bsCarousel = new (window as any).bootstrap.Carousel(carouselElement, {
          interval: 4000,
          wrap: true,
          ride: 'carousel'
        });
      }
    }, 1000);
  }
}

