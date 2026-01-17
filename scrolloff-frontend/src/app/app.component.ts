import { Component, OnInit } from '@angular/core';
import { ThemeService } from './core/services';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'ScrollOff';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Initialize theme on app start
    this.themeService.setTheme(this.themeService.getTheme());
  }
}

