import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services';

interface Tip {
  id: number;
  titre: string;
  contenu: string;
  niveau: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-tips',
  standalone: false,
  templateUrl: './tips.component.html',
  styleUrl: './tips.component.css'
})
export class TipsComponent implements OnInit {
  tips: Tip[] = [];
  loading = true;
  showForm = false;
  editingTip: Tip | null = null;
  tipForm: FormGroup;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.tipForm = this.fb.group({
      titre: ['', [Validators.required]],
      contenu: ['', [Validators.required]],
      niveau: ['low', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadTips();
  }

  loadTips(): void {
    this.loading = true;
    this.adminService.getTips().subscribe({
      next: (data) => {
        this.tips = data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tips:', error);
        this.tips = [];
        this.loading = false;
      }
    });
  }

  openCreateForm(): void {
    this.editingTip = null;
    this.tipForm.reset({ niveau: 'low' });
    this.showForm = true;
  }

  openEditForm(tip: Tip): void {
    this.editingTip = tip;
    this.tipForm.patchValue(tip);
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingTip = null;
    this.tipForm.reset({ niveau: 'low' });
  }

  onSubmit(): void {
    if (this.tipForm.valid) {
      const tipData = this.tipForm.value;

      if (this.editingTip) {
        // Update
        this.adminService.updateTip(this.editingTip.id, tipData).subscribe({
          next: () => {
            this.loadTips();
            this.closeForm();
          },
          error: (error) => {
            console.error('Error updating tip:', error);
            alert('Failed to update tip');
          }
        });
      } else {
        // Create
        this.adminService.createTip(tipData).subscribe({
          next: () => {
            this.loadTips();
            this.closeForm();
          },
          error: (error) => {
            console.error('Error creating tip:', error);
            alert('Failed to create tip');
          }
        });
      }
    }
  }

  deleteTip(tip: Tip): void {
    if (confirm('Are you sure you want to delete this tip?')) {
      this.adminService.deleteTip(tip.id).subscribe({
        next: () => {
          this.loadTips();
        },
        error: (error) => {
          console.error('Error deleting tip:', error);
          alert('Failed to delete tip');
        }
      });
    }
  }

  getNiveauClass(niveau: string): string {
    switch (niveau) {
      case 'high':
        return 'badge bg-danger';
      case 'medium':
        return 'badge bg-warning';
      default:
        return 'badge bg-success';
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

