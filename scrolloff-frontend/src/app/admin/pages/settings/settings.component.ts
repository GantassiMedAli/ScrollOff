import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {

  accountForm!: FormGroup;
  passwordForm!: FormGroup;

  // Admin data
  adminName: string = '';
  adminEmail: string = '';

  // Notification settings
  emailNotifications: boolean = true;
  systemAlerts: boolean = true;
  newUserRegistrationAlerts: boolean = true;

  // System preferences
  maintenanceMode: boolean = false;
  defaultLanguage: string = 'en';

  languages = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'ar', label: 'العربية' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadAdminData();
  }

  // ================= FORMS =================
  initializeForms(): void {
    this.accountForm = this.fb.group({
      name: [{ value: '', disabled: true }],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  // ================= DATA =================
  loadAdminData(): void {
    const currentAdmin = this.authService.getCurrentAdmin();
    if (currentAdmin) {
      this.adminName = currentAdmin.username || 'Admin';
      this.adminEmail = 'admin@scrolloff.com';

      this.accountForm.patchValue({
        name: this.adminName,
        email: this.adminEmail
      });
    }
  }

  // ================= VALIDATORS =================
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  // ================= ACTIONS =================
  onUpdateAccount(): void {
    if (this.accountForm.invalid) {
      this.markFormGroupTouched(this.accountForm);
      return;
    }

    console.log('Account updated:', this.accountForm.getRawValue());
    alert('Account updated successfully!');
  }

  onUpdatePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    console.log('Password updated');
    alert('Password updated successfully!');
    this.passwordForm.reset();
  }

  // ================= TOGGLES =================
  onToggleEmailNotifications() {
    console.log('Email notifications:', this.emailNotifications);
  }

  onToggleSystemAlerts() {
    console.log('System alerts:', this.systemAlerts);
  }

  onToggleNewUserAlerts() {
    console.log('New user alerts:', this.newUserRegistrationAlerts);
  }

  onToggleMaintenanceMode() {
    if (this.maintenanceMode &&
        !confirm('Enable maintenance mode for all users?')) {
      this.maintenanceMode = false;
      return;
    }
    console.log('Maintenance mode:', this.maintenanceMode);
  }

  onLanguageChange() {
    console.log('Language:', this.defaultLanguage);
  }

  // ================= SYSTEM =================
  onClearCache() {
    if (confirm('Clear system cache?')) {
      console.log('Cache cleared');
      alert('Cache cleared successfully!');
    }
  }

  onRefreshDashboardData() {
    console.log('Dashboard refreshed');
    alert('Dashboard data refreshed!');
  }

  // ================= SCROLL NAVIGATION =================
  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  // ================= NAVIGATION =================
  goToDashboard(): void {
    console.log('Navigate to dashboard');
    // this.router.navigate(['/admin/dashboard']);
  }

  // ================= HELPERS =================
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (!field || !field.touched || !field.errors) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['email']) return 'Invalid email format';
    if (field.errors['minlength'])
      return `Minimum ${field.errors['minlength'].requiredLength} characters`;

    if (form.errors?.['passwordMismatch'] && fieldName === 'confirmPassword')
      return 'Passwords do not match';

    return '';
  }
}

