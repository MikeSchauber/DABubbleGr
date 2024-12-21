import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CloudService } from '../../../core/services/cloud.service';
import { InfoFlyerService } from '../../../core/services/info-flyer.service';
import { AuthStyleService } from '../../../core/services/auth-style.service';
import { onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  constructor(
    public authService: AuthService,
    public authStyle: AuthStyleService,
    private cloudService: CloudService,
    public infoService: InfoFlyerService,
    public router: Router
  ) {
    this.startAuthStateDetection();
  }

  /**
   * Starts the authentication state detection to navigate the user based on authentication status.
   * If a user is authenticated, it navigates to the dashboard. Otherwise, it navigates to the login page.
   */
  startAuthStateDetection() {
    onAuthStateChanged(this.authService.auth, (user) => {
      if (this.authService.isRegistering) {
        return;
      } else {
        if (user && localStorage.getItem('currentUserData') !== null) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  /** Initiates a login process using Google authentication. */
  async googleLogin() {
    await this.authService.loginWithGoogle();
  }

  /** Logs in as a guest user and toggles the loading state during the process. */
  async loginGuest() {
    this.cloudService.loading = true;
    await this.authService.loginGuestUser();
    this.cloudService.loading = false;
  }

  /** Handles the login form submission for password-based login.
   * Validates the form and initiates the login process if valid. */
  async onSubmit() {
    if (this.loginForm.valid) {
      this.cloudService.loading = true;
      await this.authService.loginWithPassword(this.loginForm);
    }
    this.cloudService.loading = false;
  }

}
