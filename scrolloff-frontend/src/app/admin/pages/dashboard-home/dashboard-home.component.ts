import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services';

interface User {
  id: number;
  name: string;
  email: string;
  date_inscription: string;
  is_active: boolean;
}

interface Challenge {
  id: number;
  titre: string;
  description: string;
  niveau: string;
  participants?: number;
  successRate?: number;
}

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
    activeChallenges: 0,
    averageScore: 0,
    avgTimeSaved: 15.2,
    completionRate: 87
  };
  
  recentUsers: User[] = [];
  activeChallenges: Challenge[] = [];
  loading = true;

  // Trends (placeholder - would ideally come from backend)
  userTrend = '+12% from last month';
  challengeTrend = '+3 new this week';
  timeTrend = '+2.3hrs this month';
  completionTrend = '-2% from last month';

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Load stats
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = {
          ...this.stats,
          ...(data || {}),
          avgTimeSaved: data?.avgTimeSaved || 15.2,
          completionRate: data?.completionRate || 87
        };
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.loadUsers();
      }
    });
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (data) => {
        // Get most recent 4 users
        this.recentUsers = (data || []).slice(0, 4).map((user: any) => ({
          id: user.id,
          name: user.name || user.nom || 'Unknown',
          email: user.email || '',
          date_inscription: user.date_inscription || new Date().toISOString(),
          is_active: user.is_active !== undefined ? user.is_active : true
        }));
        this.loadChallenges();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.recentUsers = [];
        this.loadChallenges();
      }
    });
  }

  loadChallenges(): void {
    this.adminService.getChallenges().subscribe({
      next: (data) => {
        // Get active challenges (first 4)
        this.activeChallenges = (data || []).slice(0, 4).map((challenge: any) => ({
          id: challenge.id,
          titre: challenge.titre || 'Untitled Challenge',
          description: challenge.description || '',
          niveau: challenge.niveau || 'medium',
          participants: this.generateParticipants(challenge.id),
          successRate: this.generateSuccessRate(challenge.id)
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading challenges:', error);
        this.activeChallenges = [];
        this.loading = false;
      }
    });
  }

  // Placeholder methods for participants and success rates
  // In a real app, these would come from the database
  private generateParticipants(challengeId: number): number {
    const participants = [2847, 1523, 3891, 2156];
    return participants[challengeId % 4] || Math.floor(Math.random() * 4000) + 1000;
  }

  private generateSuccessRate(challengeId: number): number {
    const rates = [89, 76, 92, 81];
    return rates[challengeId % 4] || Math.floor(Math.random() * 30) + 70;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getUserInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getRandomChallengeCount(): number {
    return Math.floor(Math.random() * 15) + 1;
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  viewUser(user: User): void {
    console.log('View user:', user);
    // Navigate to user details page
  }

  editUser(user: User): void {
    console.log('Edit user:', user);
    // Navigate to edit user page
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user ${user.name}?`)) {
      console.log('Delete user:', user);
      // Call delete endpoint
    }
  }
}
