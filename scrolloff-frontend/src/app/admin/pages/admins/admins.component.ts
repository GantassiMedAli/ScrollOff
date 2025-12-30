import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services';

interface Admin {
  id: number;
  username: string;
}

@Component({
  selector: 'app-admins',
  standalone: false,
  templateUrl: './admins.component.html',
  styleUrl: './admins.component.css'
})
export class AdminsComponent implements OnInit {
  admins: Admin[] = [];
  loading = false;
  showAddForm = false;
  adminForm: FormGroup;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.adminForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.loading = true;
    this.adminService.getAdmins().subscribe({
      next: (data) => {
        this.admins = data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading admins:', error);
        this.admins = [];
        this.loading = false;
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.adminForm.reset();
    }
  }

  onSubmit(): void {
    if (this.adminForm.valid) {
      const formValue = this.adminForm.value;
      this.adminService.createAdmin({
        username: formValue.username,
        password: formValue.password
      }).subscribe({
        next: () => {
          this.loadAdmins();
          this.adminForm.reset();
          this.showAddForm = false;
        },
        error: (error) => {
          console.error('Error creating admin:', error);
          alert('Failed to create admin. Please try again.');
        }
      });
    }
  }
}

