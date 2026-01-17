import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { UserRoutingModule } from './user-routing.module';

import { HomeComponent } from './pages/home/home.component';
import { TestComponent } from './pages/test/test.component';
import { UserStoriesComponent } from './pages/stories/stories.component';
import { UserChallengesComponent } from './pages/challenges/challenges.component';
import { ChallengePreviewComponent } from './pages/challenge-preview/challenge-preview.component';
import { ChallengeDetailComponent } from './pages/challenge-detail/challenge-detail.component';
import { AboutComponent } from './pages/about/about';
import { QuizComponent } from './pages/quiz/quiz.component';
import { TipsComponent } from './pages/tips/tips.component';
import { ResourcesComponent } from './pages/resources/resources.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { ContactComponent } from './pages/contact/contact.component';

import { UserNavbarComponent } from './components/navbar/navbar.component';
import { UserFooterComponent } from './components/footer/footer.component';

@NgModule({
  declarations: [
    HomeComponent,
    TestComponent,
    UserStoriesComponent,
    UserChallengesComponent,
    ChallengePreviewComponent,
    ChallengeDetailComponent,
    AboutComponent,
    TipsComponent,
    ResourcesComponent,
    LoginComponent,
    SignupComponent,
    ProfileComponent,
    PrivacyComponent,
    ContactComponent,
    
  ],
 imports: [
  CommonModule,
  UserRoutingModule,
  RouterModule,
  ReactiveFormsModule,
  FormsModule,

  // Standalone Components
  QuizComponent,
  UserNavbarComponent,
  UserFooterComponent
]

})
export class UserModule { }


  






