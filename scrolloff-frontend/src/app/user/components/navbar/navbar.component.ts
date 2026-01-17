import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../core/services';

@Component({
  selector: 'app-user-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  imports: [CommonModule, RouterModule]
})
export class UserNavbarComponent implements OnInit {
  isAuthenticated = false;
  currentUser: any = null;
  showDropdown = false;
  isDarkMode = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) { }

  ngOnInit(): void {
    this.checkAuthStatus();
    this.checkTheme();
    
    // Subscribe to theme changes
    this.themeService.theme$.subscribe(theme => {
      this.isDarkMode = theme === 'dark';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        this.closeDropdown();
      }
    });
  }

  checkTheme(): void {
    this.isDarkMode = this.themeService.isDarkMode();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  checkAuthStatus(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.currentUser = this.authService.getCurrentUser();
    } else {
      this.currentUser = null;
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  logout(): void {
    this.authService.logout();
    this.isAuthenticated = false;
    this.currentUser = null;
    this.showDropdown = false;
    this.router.navigate(['/user/home']);
  }

  goToProfile(): void {
    this.showDropdown = false;
    this.router.navigate(['/user/profile']);
  }
}

