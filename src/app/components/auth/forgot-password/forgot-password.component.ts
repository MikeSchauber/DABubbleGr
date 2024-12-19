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
    public authStyle: AuthStyleService,
    private router: Router,
    private cloudService: CloudService,
    private infoService: InfoFlyerService
  ) {}

  /** Handles the form submission for password reset.
   * Checks if the email exists and executes the password reset request if valid. */
  async onSubmit() {
    this.cloudService.loading = true;
    let emailExist: boolean = await this.checkIfEmailExists(
      this.forgotPasswordForm
    );
    if (this.forgotPasswordForm.valid && emailExist) {
      await this.executePasswordRequest();
    } else {
      this.infoService.createInfo('E-Mail senden Fehlgeschlagen', true);
    }
    this.cloudService.loading = false;
  }

  /** Executes the password reset request and navigates to the login page upon success.
   * Displays an error message if the request fails. */
  async executePasswordRequest() {
    try {
      await this.authService.resetPassword(this.forgotPasswordForm);
      this.router.navigate(['/login']);
    } catch (error) {
      this.infoService.createInfo('E-Mail senden Fehlgeschlagen', true);
    }
  }

  /** Checks if the provided email exists in the publicUserData collection.
   * @param {FormGroup} formGroup - The form group containing the email to check.
   * @returns {Promise<boolean>} - A promise that resolves to true if the email exists, false otherwise. */
  async checkIfEmailExists(formGroup: FormGroup): Promise<boolean> {
    const userCollection = await this.cloudService.getCollection(
      'publicUserData'
    );
    let email = formGroup.value.email;
    let exists: boolean = false;
    for (const member of userCollection) {
      if (email === member.accountEmail) {
        exists = true;
        break;
      }
    }
    return exists;
  }
}
