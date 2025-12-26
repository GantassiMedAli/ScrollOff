import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stats-card',
  standalone: false,
  templateUrl: './stats-card.component.html',
  styleUrl: './stats-card.component.css'
})
export class StatsCardComponent {
  @Input() title: string = '';
  @Input() value: number | string = 0;
  @Input() icon: string = '';
  @Input() color: string = 'primary';
}

