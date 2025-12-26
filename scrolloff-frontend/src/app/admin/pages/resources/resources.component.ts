import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services';

interface Resource {
  id: number;
  titre: string;
  description: string;
  lien: string;
  type: 'Article' | 'Video' | 'Poster' | 'External link';
}

@Component({
  selector: 'app-resources',
  standalone: false,
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.css'
})
export class ResourcesComponent implements OnInit {
  resources: Resource[] = [];
  loading = true;
  showForm = false;
  editingResource: Resource | null = null;
  resourceForm: FormGroup;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.resourceForm = this.fb.group({
      titre: ['', [Validators.required]],
      description: ['', [Validators.required]],
      lien: ['', [Validators.required]],
      type: ['Article', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadResources();
  }

  loadResources(): void {
    this.loading = true;
    this.adminService.getResources().subscribe({
      next: (data) => {
        this.resources = data || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading resources:', error);
        this.resources = [];
        this.loading = false;
      }
    });
  }

  openCreateForm(): void {
    this.editingResource = null;
    this.resourceForm.reset({ type: 'Article' });
    this.showForm = true;
  }

  openEditForm(resource: Resource): void {
    this.editingResource = resource;
    this.resourceForm.patchValue(resource);
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingResource = null;
    this.resourceForm.reset({ type: 'Article' });
  }

  onSubmit(): void {
    if (this.resourceForm.valid) {
      const resourceData = this.resourceForm.value;

      if (this.editingResource) {
        // Update
        this.adminService.updateResource(this.editingResource.id, resourceData).subscribe({
          next: () => {
            this.loadResources();
            this.closeForm();
          },
          error: (error) => {
            console.error('Error updating resource:', error);
            alert('Failed to update resource');
          }
        });
      } else {
        // Create
        this.adminService.createResource(resourceData).subscribe({
          next: () => {
            this.loadResources();
            this.closeForm();
          },
          error: (error) => {
            console.error('Error creating resource:', error);
            alert('Failed to create resource');
          }
        });
      }
    }
  }

  deleteResource(resource: Resource): void {
    if (confirm('Are you sure you want to delete this resource?')) {
      this.adminService.deleteResource(resource.id).subscribe({
        next: () => {
          this.loadResources();
        },
        error: (error) => {
          console.error('Error deleting resource:', error);
          alert('Failed to delete resource');
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

