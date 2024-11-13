import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { ChatComponent } from './components/dashboard/chat/chat.component';

export const routes: Routes = [
  { path: '', component: ChatComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgotPasswort', component: ForgotPasswordComponent },
];
