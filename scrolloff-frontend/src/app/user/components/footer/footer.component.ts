import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
  imports: [CommonModule, RouterModule]
})
export class UserFooterComponent {
  constructor() { }
}

