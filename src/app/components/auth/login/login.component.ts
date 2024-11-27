import { AfterViewInit, Component, OnInit } from '@angular/core';
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
    private cloudService: CloudService,
    public infoService: InfoFlyerService,
  ) {}

  async googleLogin() {
    await this.authService.loginWithGoogle();
  }

  async loginGuest() {
    this.cloudService.loading = true;
    await this.authService.loginGuestUser();
    this.cloudService.loading = false;
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.cloudService.loading = true;
      await this.authService.loginUser(this.loginForm);
      this.cloudService.loading = false;
    }
    this.cloudService.loading = false;
  }
}
