import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-privacy',
  standalone: false,
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.css'
})
export class PrivacyComponent implements OnInit {
  activeSection: string = 'introduction';
  lastUpdated: string = 'January 15, 2024';

  constructor() { }

  ngOnInit(): void {
    // Scroll to section if hash is present in URL
    const hash = window.location.hash.substring(1);
    if (hash) {
      this.scrollToSection(hash);
      this.activeSection = hash;
    }
  }

  /**
   * Set active section and scroll to it
   */
  setActiveSection(section: string): void {
    this.activeSection = section;
    this.scrollToSection(section);
  }

  /**
   * Scroll to a specific section
   */
  private scrollToSection(section: string): void {
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
