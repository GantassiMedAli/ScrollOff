import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '../core/guards';
import { DashboardHomeComponent } from './pages/dashboard-home/dashboard-home.component';
import { UsersComponent } from './pages/users/users.component';
import { ResultsComponent } from './pages/results/results.component';
import { StoriesComponent } from './pages/stories/stories.component';
import { TipsComponent } from './pages/tips/tips.component';
import { ResourcesComponent } from './pages/resources/resources.component';
import { ChallengesComponent } from './pages/challenges/challenges.component';
import { AdminsComponent } from './pages/admins/admins.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardHomeComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'results',
    component: ResultsComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'stories',
    component: StoriesComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'tips',
    component: TipsComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'resources',
    component: ResourcesComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'challenges',
    component: ChallengesComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'admins',
    component: AdminsComponent,
    canActivate: [AdminGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }

