import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminRoutingModule } from './admin-routing.module';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { DashboardHomeComponent } from './pages/dashboard-home/dashboard-home.component';
import { UsersComponent } from './pages/users/users.component';
import { ResultsComponent } from './pages/results/results.component';
import { StoriesComponent } from './pages/stories/stories.component';
import { TipsComponent } from './pages/tips/tips.component';
import { ResourcesComponent } from './pages/resources/resources.component';
import { ChallengesComponent } from './pages/challenges/challenges.component';

@NgModule({
  declarations: [
    SidebarComponent,
    NavbarComponent,
    StatsCardComponent,
    DashboardHomeComponent,
    UsersComponent,
    ResultsComponent,
    StoriesComponent,
    TipsComponent,
    ResourcesComponent,
    ChallengesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    RouterModule
  ]
})
export class AdminModule { }

