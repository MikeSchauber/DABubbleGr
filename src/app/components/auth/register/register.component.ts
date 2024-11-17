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
import { User } from '../../../models/user.model';
import { addDoc } from 'firebase/firestore';

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
    password: new FormControl('', Validators.required),
    privacyPolicy: new FormControl(false, Validators.requiredTrue),
  });

  constructor(public authService: AuthService, private router: Router) {}

  async onSubmit() {
    if (this.profileForm.valid) {
      console.log('Formular ist gültig:', this.profileForm.value);
      this.authService.profileFormFullfilled = this.profileForm.value;
      await this.authService.createUser();
      await this.authService.createMemberData();
      this.router.navigate(['/add-avatar']);
    } else {
      console.log('Formular ist ungültig');
    }
  }
}

// diese Funktion kreiert neuen user in Authentication
// await this.authService.createUser();
