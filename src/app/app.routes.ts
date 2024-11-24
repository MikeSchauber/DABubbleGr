import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ImprintComponent } from './shared/imprint/imprint.component';
import { PrivacyPolicyComponent } from './shared/privacy-policy/privacy-policy.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AddAvatarComponent } from './components/auth/add-avatar/add-avatar.component';
import { StartAnimationComponent } from './components/start-animation/start-animation.component';
import { provideAnimations } from '@angular/platform-browser/animations';

export const routes: Routes = [
  { path: '', component: StartAnimationComponent },  
  { path: 'login', component: LoginComponent },   
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'add-avatar', component: AddAvatarComponent },
  // {
  //   path: 'dashboard',
  //   loadComponent: () =>
  //     import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
  //   providers: [provideAnimations()], // Ensure this is added
  // },
  { path: 'profile', component: ProfileComponent },
  { path: 'dashboard', component: DashboardComponent },  
  { path: 'imprint', component: ImprintComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '**', redirectTo: 'login', pathMatch: 'full' },
  
];


// export const appRoutes: Routes = [
//   { path: 'dashboard', component: DashboardComponent },
//   { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
//   { path: '**', redirectTo: '/dashboard' }
// ];




export const ameerRouts: Routes = [
  
  { path: '', redirectTo: '/profile', pathMatch: 'full' },
  { path: 'profile', component: ProfileComponent }
];