import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  activeSection: string = 'profile';
  
  // Profile data (mock data if API doesn't exist)
  profileData = {
    fullName: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    avatar: '',
    createdAt: new Date()
  };

  // App preferences
  preferences = {
    dailyReminders: true,
    weeklyReports: true,
    challengeSuggestions: false,
    communityUpdates: true
  };

  // Notification settings
  notifications = {
    push: true,
    email: true,
    sms: false
  };

  // Privacy settings
  privacy = {
    profileVisible: true,
    shareProgress: true,
    allowAnalytics: false,
    showAchievements: true
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check authentication
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/user/login']);
      return;
    }

    // Get current user
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser) {
      // Populate profile data from user
      this.profileData = {
        fullName: this.currentUser.nom || 'User',
        username: this.generateUsername(this.currentUser.email),
        email: this.currentUser.email || '',
        phone: '', // Not available in User interface, will be empty
        bio: 'Digital wellness enthusiast on a journey to find balance. Love connecting with others who are working on healthier te',
        avatar: '', // Default avatar will be used if empty
        createdAt: new Date() // Mock date, replace with actual date if available from API
      };
    }

    // TODO: Fetch full profile data from API if endpoint exists
    // Example: this.userService.getProfile().subscribe(...)
  }

  /**
   * Generate username from email (e.g., jessica.parker@email.com -> @jessicap)
   */
  private generateUsername(email: string): string {
    if (!email) return '@user';
    const username = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
    return `@${username}`;
  }

  /**
   * Handle logout - clear token and redirect to login
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/user/login']);
  }

  /**
   * Navigate back to dashboard/home
   */
  goToDashboard(): void {
    this.router.navigate(['/user/home']);
  }

  /**
   * Set active section in sidebar
   */
  setActiveSection(section: string): void {
    this.activeSection = section;
    
    // Navigate to privacy page when privacy is clicked
    if (section === 'privacy') {
      this.router.navigate(['/user/privacy']);
    }
    // TODO: Implement navigation to other settings sections (preferences, notifications, security, account)
  }

  /**
   * Handle save changes (UI only for now)
   */
  saveChanges(): void {
    // TODO: Implement API call to save profile changes
    console.log('Saving profile changes:', this.profileData);
    alert('Profile changes saved! (This is a placeholder - API integration needed)');
  }

  /**
   * Handle change photo (UI only for now)
   */
  changePhoto(): void {
    // TODO: Implement photo upload functionality
    console.log('Change photo clicked');
    alert('Photo upload functionality will be implemented soon!');
  }

  /**
   * Handle export data
   */
  exportData(): void {
    // TODO: Implement data export functionality
    console.log('Export data clicked');
    alert('Data export functionality will be implemented soon!');
  }

  /**
   * Handle delete account
   */
  deleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // TODO: Implement account deletion API call
      console.log('Delete account clicked');
      alert('Account deletion functionality will be implemented soon!');
    }
  }

  /**
   * Toggle preference
   */
  togglePreference(key: keyof typeof this.preferences): void {
    this.preferences[key] = !this.preferences[key];
    // TODO: Save to API
  }

  /**
   * Toggle notification
   */
  toggleNotification(key: keyof typeof this.notifications): void {
    this.notifications[key] = !this.notifications[key];
    // TODO: Save to API
  }

  /**
   * Toggle privacy setting
   */
  togglePrivacy(key: keyof typeof this.privacy): void {
    this.privacy[key] = !this.privacy[key];
    // TODO: Save to API
  }
}
