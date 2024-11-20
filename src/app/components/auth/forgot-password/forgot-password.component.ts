import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CloudService } from '../../../core/services/cloud.service';
import { InfoFlyerService } from '../../../core/services/info-flyer.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  forgotPasswordForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });
  constructor(
    public authService: AuthService,
    private router: Router,
    private cloudService: CloudService,
  ) {}

  async onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.cloudService.loading = true;
      try {
        await this.authService.resetPassword(this.forgotPasswordForm);
        this.router.navigate(['/login']);
      } catch (error) {
        alert('Fehler beim Senden der E-Mail: ' + error);
      }
      this.cloudService.loading = false;
    }
  }
}
