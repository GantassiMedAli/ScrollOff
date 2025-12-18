import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRoutingModule } from './user-routing.module';
import { HomeComponent } from './pages/home/home.component';
import { TestComponent } from './pages/test/test.component';
import { UserStoriesComponent } from './pages/stories/stories.component';
import { UserChallengesComponent } from './pages/challenges/challenges.component';

@NgModule({
  declarations: [
    HomeComponent,
    TestComponent,
    UserStoriesComponent,
    UserChallengesComponent
  ],
  imports: [
    CommonModule,
    UserRoutingModule
  ]
})
export class UserModule { }








