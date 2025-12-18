import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services';

@Component({
  selector: 'app-results',
  standalone: false,
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent implements OnInit {
  stats = {
    totalTests: 0,
    averageScore: 0,
    distributionByLevel: [] as any[],
    evolutionByDate: [] as any[]
  };
  loading = true;

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.adminService.getResultsStats().subscribe({
      next: (data) => {
        this.stats = data || {
          totalTests: 0,
          averageScore: 0,
          distributionByLevel: [],
          evolutionByDate: []
        };
        // Ensure arrays are always initialized
        if (!this.stats.distributionByLevel) {
          this.stats.distributionByLevel = [];
        }
        if (!this.stats.evolutionByDate) {
          this.stats.evolutionByDate = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading results stats:', error);
        this.stats = {
          totalTests: 0,
          averageScore: 0,
          distributionByLevel: [],
          evolutionByDate: []
        };
        this.loading = false;
      }
    });
  }

  formatScore(score: number): string {
    return score.toFixed(2);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}

