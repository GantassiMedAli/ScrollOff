import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services';

interface User {
  id: number;
  name: string;
  email: string;
  date_inscription: string;
  is_active: boolean;
}

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = true;

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users = data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.users = [];
        this.loading = false;
      }
    });
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.is_active;
    this.adminService.updateUserStatus(user.id, newStatus).subscribe({
      next: () => {
        user.is_active = newStatus;
      },
      error: (error) => {
        console.error('Error updating user status:', error);
        alert('Failed to update user status');
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

