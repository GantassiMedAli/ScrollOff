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
  filteredResources: Resource[] = [];
  loading = false;
  error: string | null = null;

  // Search and filters
  searchQuery = '';
  selectedTypeFilter = 'all';
  selectedTopicFilter = 'all';
  sortBy = 'most-recent';

  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  // Filter options
  typeFilters = [
    { value: 'all', label: 'All Resources' },
    { value: 'Article', label: 'Scientific Articles' },
    { value: 'Video', label: 'Videos' },
    { value: 'Story', label: 'Success Stories' },
    { value: 'Poster', label: 'Awareness Guides' }
  ];

  topicFilters = [
    { value: 'all', label: 'All' },
    { value: 'mental-health', label: 'Mental Health' },
    { value: 'focus', label: 'Focus' },
    { value: 'digital-detox', label: 'Digital Detox' },
    { value: 'awareness', label: 'Awareness' }
  ];

  sortOptions = [
    { value: 'most-recent', label: 'Most Recent' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' }
  ];

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
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading resources:', error);
        const status = error?.status || 'offline';
        const msg = (error && (error.error?.error || error.message)) || 'Please try again later.';
        this.error = `Failed to load resources (${status}): ${msg}`;
        this.resources = [];
        this.filteredResources = [];
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.resources];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.titre?.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.type?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (this.selectedTypeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === this.selectedTypeFilter);
    }

    // Topic filter (simplified - would need topic field in DB)
    // For now, we'll filter based on description/keywords
    if (this.selectedTopicFilter !== 'all') {
      const topicMap: { [key: string]: string[] } = {
        'mental-health': ['mental', 'health', 'wellness', 'wellbeing', 'mind', 'brain'],
        'focus': ['focus', 'concentration', 'attention', 'productivity', 'deep work'],
        'digital-detox': ['detox', 'break', 'disconnect', 'unplug', 'screen-free'],
        'awareness': ['awareness', 'guide', 'information', 'learn', 'education']
      };
      const keywords = topicMap[this.selectedTopicFilter] || [];
      filtered = filtered.filter(r => {
        const text = (r.titre + ' ' + r.description).toLowerCase();
        return keywords.some(kw => text.includes(kw));
      });
    }

    // Sort
    switch (this.sortBy) {
      case 'oldest':
        filtered.sort((a, b) => {
          const dateA = a.date_ajout ? new Date(a.date_ajout).getTime() : 0;
          const dateB = b.date_ajout ? new Date(b.date_ajout).getTime() : 0;
          return dateA - dateB;
        });
        break;
      case 'title-asc':
        filtered.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
        break;
      case 'title-desc':
        filtered.sort((a, b) => (b.titre || '').localeCompare(a.titre || ''));
        break;
      case 'most-recent':
      default:
        filtered.sort((a, b) => {
          const dateA = a.date_ajout ? new Date(a.date_ajout).getTime() : 0;
          const dateB = b.date_ajout ? new Date(b.date_ajout).getTime() : 0;
          return dateB - dateA;
        });
    }

    this.filteredResources = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredResources.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  getPaginatedResources(): Resource[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredResources.slice(start, end);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5; // Show max 5 page numbers
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxPages - 1);
    
    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getTypeIcon(type: string): string {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('video')) return 'bi-play-circle';
    if (typeLower.includes('article')) return 'bi-file-text';
    if (typeLower.includes('poster')) return 'bi-image';
    return 'bi-link-45deg';
  }

  getTypeLabel(type: string): string {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('video')) return 'VIDEO';
    if (typeLower.includes('article')) return 'ARTICLE';
    if (typeLower.includes('poster')) return 'GUIDE';
    if (typeLower.includes('story')) return 'STORY';
    return 'RESOURCE';
  }

  getTypeClass(type: string): string {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('video')) return 'type-video';
    if (typeLower.includes('article')) return 'type-article';
    if (typeLower.includes('poster')) return 'type-guide';
    return 'type-default';
  }

  getReadTime(type: string): string {
    // Estimate read time (would ideally come from DB)
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('video')) return '12 min';
    if (typeLower.includes('article')) return '8 min read';
    return '10 min read';
  }

  getTopicTag(resource: Resource): string {
    // Infer topic from content (would ideally come from DB)
    const text = (resource.titre + ' ' + resource.description).toLowerCase();
    if (text.includes('mental') || text.includes('health') || text.includes('wellness')) {
      return 'Mental Health';
    }
    if (text.includes('focus') || text.includes('concentration') || text.includes('productivity')) {
      return 'Focus';
    }
    if (text.includes('detox') || text.includes('break') || text.includes('unplug')) {
      return 'Digital Detox';
    }
    return 'Awareness';
  }

  getResourceImage(resource: Resource): string {
    // Placeholder images - would ideally come from DB
    const typeLower = resource.type?.toLowerCase() || '';
    const images = {
      article: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
      video: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=250&fit=crop',
      poster: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&h=250&fit=crop',
      default: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=400&h=250&fit=crop'
    };
    
    if (typeLower.includes('video')) return images.video;
    if (typeLower.includes('article')) return images.article;
    if (typeLower.includes('poster')) return images.poster;
    return images.default;
  }

  getActionButtonText(type: string): string {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('video')) return '► Watch Now';
    if (typeLower.includes('story')) return '+ Read Story';
    if (typeLower.includes('poster')) return '→ Read Guide';
    return '+ Read More';
  }

  openResource(link: string): void {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }
}
