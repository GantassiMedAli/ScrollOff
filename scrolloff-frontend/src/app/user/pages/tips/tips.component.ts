import { Component, OnInit } from '@angular/core';
import { TipService } from '../../../core/services';
import { Tip } from '../../../shared/models';

@Component({
  selector: 'app-tips',
  standalone: false,
  templateUrl: './tips.component.html',
  styleUrl: './tips.component.css'
})
export class TipsComponent implements OnInit {
  tips: Tip[] = [];
  loading = false;
  error: string | null = null;

  constructor(private tipService: TipService) { }

  ngOnInit(): void {
    this.loadTips();
  }

  loadTips(): void {
    this.loading = true;
    this.error = null;
    this.tipService.getTips().subscribe({
      next: (data) => {
        this.tips = data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tips:', error);
        const status = error?.status || 'offline';
        const msg = (error && (error.error?.error || error.message)) || 'Please try again later.';
        this.error = `Failed to load tips (${status}): ${msg}`;
        this.tips = [];
        this.loading = false;
      }
    });
  }

  getLevelClass(niveau: string): string {
    const level = niveau?.toLowerCase() || '';
    if (level === 'high') return 'level-high';
    if (level === 'medium') return 'level-medium';
    return 'level-low';
  }

  getLevelLabel(niveau: string): string {
    const level = niveau?.toLowerCase() || '';
    return level.charAt(0).toUpperCase() + level.slice(1);
  }
}
