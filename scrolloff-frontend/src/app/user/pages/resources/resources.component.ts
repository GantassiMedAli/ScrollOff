import { Component, OnInit } from '@angular/core';
import { ResourceService } from '../../../core/services';
import { Resource } from '../../../shared/models';

@Component({
  selector: 'app-resources',
  standalone: false,
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.css'
})
export class ResourcesComponent implements OnInit {
  resources: Resource[] = [];
  loading = false;
  error: string | null = null;

  constructor(private resourceService: ResourceService) { }

  ngOnInit(): void {
    this.loadResources();
  }

  loadResources(): void {
    this.loading = true;
    this.error = null;
    this.resourceService.getResources().subscribe({
      next: (data) => {
        this.resources = data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading resources:', error);
        const status = error?.status || 'offline';
        const msg = (error && (error.error?.error || error.message)) || 'Please try again later.';
        this.error = `Failed to load resources (${status}): ${msg}`;
        this.resources = [];
        this.loading = false;
      }
    });
  }

  getTypeIcon(type: string): string {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('video')) return 'fa-video';
    if (typeLower.includes('podcast')) return 'fa-podcast';
    if (typeLower.includes('article')) return 'fa-file-alt';
    if (typeLower.includes('poster')) return 'fa-image';
    return 'fa-external-link-alt';
  }

  getTypeClass(type: string): string {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('video')) return 'type-video';
    if (typeLower.includes('podcast')) return 'type-podcast';
    if (typeLower.includes('article')) return 'type-article';
    if (typeLower.includes('poster')) return 'type-poster';
    return 'type-link';
  }

  openResource(link: string): void {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }
}
