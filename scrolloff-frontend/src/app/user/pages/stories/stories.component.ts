import { Component, OnInit } from '@angular/core';
import { StoryService } from '../../../core/services';
import { Story } from '../../../shared/models';

@Component({
  selector: 'app-user-stories',
  standalone: false,
  templateUrl: './stories.component.html',
  styleUrl: './stories.component.css'
})
export class UserStoriesComponent implements OnInit {
  stories: Story[] = [];
  loading = false;
  error: string | null = null;

  constructor(private storyService: StoryService) { }

  ngOnInit(): void {
    this.loadStories();
  }

  loadStories(): void {
    this.loading = true;
    this.error = null;
    this.storyService.getStories().subscribe({
      next: (data) => {
        this.stories = data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading stories:', error);
        const status = error?.status || 'offline';
        const msg = (error && (error.error?.error || error.message)) || 'Please try again later.';
        this.error = `Failed to load stories (${status}): ${msg}`;
        this.stories = [];
        this.loading = false;
      }
    });
  }

  getAuthorName(story: Story): string {
    return story.is_anonymous ? 'Anonymous' : 'User';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
