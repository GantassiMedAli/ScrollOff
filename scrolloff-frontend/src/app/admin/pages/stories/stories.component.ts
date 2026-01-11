import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services';

interface Story {
  id: number;
  titre?: string;
  contenu: string;
  statut: 'pending' | 'approved' | 'rejected';
  is_anonymous: boolean;
  date_creation: string;
  id_user?: number;
  id_admin?: number;
}

@Component({
  selector: 'app-stories',
  standalone: false,
  templateUrl: './stories.component.html',
  styleUrl: './stories.component.css'
})
export class StoriesComponent implements OnInit {
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';
  stories: Story[] = [];
  filteredStories: Story[] = [];
  
  // Computed arrays for each status
  pendingStories: Story[] = [];
  approvedStories: Story[] = [];
  rejectedStories: Story[] = [];
  
  // Count properties for display
  pendingStoriesCount = 0;
  hasNoStories = false;
  
  loading = true;

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadStories();
  }

  loadStories(): void {
    this.loading = true;
    this.adminService.getStories().subscribe({
      next: (data) => {
        const raw = data || [];
        // Ensure we provide a safe `titre` fallback for UI consumption (no DB `titre` column on stories)
        this.stories = raw.map((s: any) => ({
          ...s,
          titre: s.titre || (s.contenu ? (s.contenu.length > 80 ? s.contenu.slice(0,80) + '...' : s.contenu) : '')
        }));
        this.filterStories();
        this.loading = false;
      },
      error: (error) => {
        // More verbose error logging so we can see server status and body
        console.error('Error loading stories:', error && error.status, error && (error.error || error.message));
        this.stories = [];
        this.filterStories();
        this.loading = false;
      }
    });
  }

  filterStories(): void {
    // Filter stories by status
    this.pendingStories = this.stories.filter(story => story.statut === 'pending');
    this.approvedStories = this.stories.filter(story => story.statut === 'approved');
    this.rejectedStories = this.stories.filter(story => story.statut === 'rejected');
    
    // Update counts
    this.pendingStoriesCount = this.pendingStories.length;
    
    // Set filtered stories based on active tab
    switch (this.activeTab) {
      case 'pending':
        this.filteredStories = this.pendingStories;
        break;
      case 'approved':
        this.filteredStories = this.approvedStories;
        break;
      case 'rejected':
        this.filteredStories = this.rejectedStories;
        break;
      default:
        this.filteredStories = [];
    }
    
    // Update hasNoStories flag
    this.hasNoStories = this.filteredStories.length === 0;
  }

  setTab(tab: 'pending' | 'approved' | 'rejected'): void {
    this.activeTab = tab;
    this.filterStories();
  }

  approveStory(story: Story): void {
    this.adminService.updateStoryStatus(story.id, 'approved').subscribe({
      next: () => {
        story.statut = 'approved';
        this.filterStories();
      },
      error: (error) => {
        console.error('Error approving story:', error && error.status, error && (error.error || error.message));
        alert('Failed to approve story');
      }
    });
  }

  rejectStory(story: Story): void {
    this.adminService.updateStoryStatus(story.id, 'rejected').subscribe({
      next: () => {
        story.statut = 'rejected';
        this.filterStories();
      },
      error: (error) => {
        console.error('Error rejecting story:', error && error.status, error && (error.error || error.message));
        alert('Failed to reject story');
      }
    });
  }

  deleteStory(story: Story): void {
    if (confirm('Are you sure you want to delete this story?')) {
      this.adminService.deleteStory(story.id).subscribe({
        next: () => {
          this.stories = this.stories.filter(s => s.id !== story.id);
          this.filterStories();
        },
        error: (error) => {
          console.error('Error deleting story:', error && error.status, error && (error.error || error.message));
          alert('Failed to delete story');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'approved':
        return 'badge bg-success';
      case 'rejected':
        return 'badge bg-danger';
      default:
        return 'badge bg-warning';
    }
  }
}

