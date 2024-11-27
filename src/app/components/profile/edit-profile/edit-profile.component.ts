import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent implements OnInit {
  closeButton: string = 'assets/icons/close.svg';
  editForm = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });
  constructor(
    public profileService: ProfileService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserData;
    this.editForm = new FormGroup({
      fullName: new FormControl(this.authService.currentUserData.displayName, [
        Validators.required,
      ]),
      email: new FormControl(this.authService.currentUserData.displayEmail, [
        Validators.required,
        Validators.email,
      ]),
    });
  }

  changeCloseButton(path: string) {
    setTimeout(() => {
      this.closeButton = path;
    }, 75);
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      this.profileService.saveEditings(this.editForm);
    }
  }
}
