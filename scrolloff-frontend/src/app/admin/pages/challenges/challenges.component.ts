import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services';

interface Challenge {
  id: number;
  titre: string;
  description: string;
  niveau: string;
  duree: number;
}

@Component({
  selector: 'app-challenges',
  standalone: false,
  templateUrl: './challenges.component.html',
  styleUrl: './challenges.component.css'
})
export class ChallengesComponent implements OnInit {
  challenges: Challenge[] = [];
  loading = true;
  showForm = false;
  editingChallenge: Challenge | null = null;
  challengeForm: FormGroup;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.challengeForm = this.fb.group({
      titre: ['', [Validators.required]],
      description: ['', [Validators.required]],
      niveau: ['', [Validators.required]],
      duree: [0, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadChallenges();
  }

  loadChallenges(): void {
    this.loading = true;
    this.adminService.getChallenges().subscribe({
      next: (data) => {
        this.challenges = data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading challenges:', error);
        this.challenges = [];
        this.loading = false;
      }
    });
  }

  openCreateForm(): void {
    this.editingChallenge = null;
    this.challengeForm.reset({ duree: 0 });
    this.showForm = true;
  }

  openEditForm(challenge: Challenge): void {
    this.editingChallenge = challenge;
    this.challengeForm.patchValue(challenge);
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingChallenge = null;
    this.challengeForm.reset({ duree: 0 });
  }

  onSubmit(): void {
    if (this.challengeForm.valid) {
      const challengeData = this.challengeForm.value;

      if (this.editingChallenge) {
        // Update
        this.adminService.updateChallenge(this.editingChallenge.id, challengeData).subscribe({
          next: () => {
            this.loadChallenges();
            this.closeForm();
          },
          error: (error) => {
            console.error('Error updating challenge:', error);
            alert('Failed to update challenge');
          }
        });
      } else {
        // Create
        this.adminService.createChallenge(challengeData).subscribe({
          next: () => {
            this.loadChallenges();
            this.closeForm();
          },
          error: (error) => {
            console.error('Error creating challenge:', error);
            alert('Failed to create challenge');
          }
        });
      }
    }
  }

  deleteChallenge(challenge: Challenge): void {
    if (confirm('Are you sure you want to delete this challenge?')) {
      this.adminService.deleteChallenge(challenge.id).subscribe({
        next: () => {
          this.loadChallenges();
        },
        error: (error) => {
          console.error('Error deleting challenge:', error);
          alert('Failed to delete challenge');
        }
      });
    }
  }

  getTruncatedContent(content: string, maxLength: number = 50): string {
    if (!content) {
      return '';
    }
    if (content.length > maxLength) {
      return content.slice(0, maxLength) + '...';
    }
    return content;
  }
}

