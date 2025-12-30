import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserRoutingModule } from './user-routing.module';
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
import { UserNavbarComponent } from './components/navbar/navbar.component';
import { UserFooterComponent } from './components/footer/footer.component';

@NgModule({
  declarations: [
    HomeComponent,
    TestComponent,
    UserStoriesComponent,
    UserChallengesComponent,
    AboutComponent,
    QuizComponent,
    TipsComponent,
    ResourcesComponent,
    LoginComponent,
    SignupComponent,
    UserNavbarComponent,
    UserFooterComponent
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    RouterModule
  ]
})
export class UserModule { }

  






