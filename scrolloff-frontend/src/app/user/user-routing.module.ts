import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { TestComponent } from './pages/test/test.component';
import { UserStoriesComponent } from './pages/stories/stories.component';
import { UserChallengesComponent } from './pages/challenges/challenges.component';
import { AboutComponent } from './pages/about/about';
import { QuizComponent } from './pages/quiz/quiz.component';
import { TipsComponent } from './pages/tips/tips.component';
import { ResourcesComponent } from './pages/resources/resources.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'test',
    component: TestComponent
  },
  {
    path: 'stories',
    component: UserStoriesComponent
  },
  {
    path: 'challenges',
    component: UserChallengesComponent
  },
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'quiz',
    component: QuizComponent
  },
  {
    path: 'tips',
    component: TipsComponent
  },
  {
    path: 'resources',
    component: ResourcesComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }








