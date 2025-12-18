import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  adminUsername = '';

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    const admin = this.authService.getCurrentAdmin();
    this.adminUsername = admin?.username || 'Admin';
  }

  logout(): void {
    this.authService.logout();
  }
}

