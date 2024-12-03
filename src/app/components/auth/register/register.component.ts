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
import { AuthStyleService } from '../../../core/services/auth-style.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  profileForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('',[Validators.required, Validators.minLength(8)]),
    privacyPolicy: new FormControl(false, Validators.requiredTrue),
  });

  constructor(
    public authService: AuthService,
    public authStyle: AuthStyleService,
    private cloudService: CloudService,
  ) {}

  async onSubmit() {
    if (this.profileForm.valid) {
      this.cloudService.loading = true;
      await this.authService.registerAndLoginUser(this.profileForm);
      this.cloudService.loading = false;
    }
  }
}
