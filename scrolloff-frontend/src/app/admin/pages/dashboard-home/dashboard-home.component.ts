import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services';

@Component({
  selector: 'app-dashboard-home',
  standalone: false,
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css'
})
export class DashboardHomeComponent implements OnInit {
  stats = {
    totalUsers: 0,
    totalTests: 0,
    pendingStories: 0,
    activeChallenges: 0
  };
  loading = true;

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data || {
          totalUsers: 0,
          totalTests: 0,
          pendingStories: 0,
          activeChallenges: 0
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.stats = {
          totalUsers: 0,
          totalTests: 0,
          pendingStories: 0,
          activeChallenges: 0
        };
        this.loading = false;
      }
    });
  }
}

