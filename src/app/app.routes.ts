import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ImprintComponent } from './shared/imprint/imprint.component';
import { PrivacyPolicyComponent } from './shared/privacy-policy/privacy-policy.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { AddAvatarComponent } from './components/auth/add-avatar/add-avatar.component';
import { StartAnimationComponent } from './components/start-animation/start-animation.component';
import { authGuard } from './core/guards/auth-guard.guard';
import { loginRedirectGuard } from './core/guards/login-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    component: StartAnimationComponent,
    canActivate: [loginRedirectGuard],
  },
  // {
  //   path: 'login',
  //   component: LoginComponent,
  //   canActivate: [loginRedirectGuard],
  // },


  {
    path: 'login',
    
    component: DashboardComponent,
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'add-avatar',
    component: AddAvatarComponent,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  { path: 'imprint', component: ImprintComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
];
