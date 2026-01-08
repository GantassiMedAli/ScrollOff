import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      // Age is optional and should not block registration
      age: ['']
    });
  }

  submit() {
    this.error = null;
    this.success = null;
    if (this.registerForm.invalid) return;

    // Log the outgoing payload for easier debugging of 404/other failures
    const payload = this.registerForm.value;
    console.log('[Signup] register payload', payload);

    this.loading = true;
    this.authService.register(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res?.message || 'Registration successful. Please log in.';
        // Navigate to login after short delay
        setTimeout(() => this.router.navigate(['/user/login']), 1200);
      },
      error: (err) => {
        this.loading = false;
        console.error('Registration error:', err);
        // Prefer server-provided message, then HttpClient message, then status
        this.error = err?.error?.error || err?.error?.message || err?.message || `Registration failed (${err?.status || 'unknown'})`;
      }
    });
  }
}

