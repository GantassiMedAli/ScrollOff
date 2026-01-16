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
  filteredTips: Tip[] = [];
  loading = false;
  error: string | null = null;
  userLevel: string = 'low'; // Default to low level tips

  constructor(private tipService: TipService) { }

  ngOnInit(): void {
    // BUG FIX 2: Get user's quiz level from localStorage to filter tips
    // Previously: always showed all tips, user expected level-specific tips
    // Now: filters tips based on quiz result (low/medium/high)
    const storedLevel = localStorage.getItem('user_quiz_level');
    if (storedLevel) {
      // Map quiz categories to tip levels
      if (storedLevel === 'low risk') {
        this.userLevel = 'low';
      } else if (storedLevel === 'medium risk') {
        this.userLevel = 'medium';
      } else if (storedLevel === 'high risk') {
        this.userLevel = 'high';
      } else {
        this.userLevel = storedLevel; // fallback
      }
    }
    
    this.loadTips();
  }

  loadTips(): void {
    this.loading = true;
    this.error = null;
    this.tipService.getTips().subscribe({
      next: (data) => {
        this.tips = data || [];
        // Filter tips based on user's quiz level
        // BUG FIX 2: Only show tips matching the user's assessed level
        this.filteredTips = this.tips.filter(tip => 
          tip.niveau?.toLowerCase() === this.userLevel.toLowerCase()
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tips:', error);
        const status = error?.status || 'offline';
        const msg = (error && (error.error?.error || error.message)) || 'Please try again later.';
        this.error = `Failed to load tips (${status}): ${msg}`;
        this.tips = [];
        this.filteredTips = [];
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
