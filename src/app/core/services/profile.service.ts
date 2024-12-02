import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  showPopup: boolean = true;
  showProfile: boolean = false;
  showEditMode: boolean = true;
  showLogout: boolean = false;

  constructor(private authService: AuthService) {}

  preventDefault(e: MouseEvent) {
    e.stopPropagation();
  }

  switchToEditProfile() {
    this.showEditMode = true;
    this.showProfile = false;
  }

  toggleProfileDisplay() {
    this.authService.loadCurrentUserDataFromLocalStorage();
    this.showLogout = false;
    this.showEditMode = false;
    this.showProfile = true;
    if (!this.showPopup) {
      this.showPopup = !this.showPopup;
    }
  }

  toggleLogoutDisplay() {
    this.showProfile = false;
    this.showEditMode = false;
    this.showLogout = true;
    this.showPopup = !this.showPopup;
  }

  closePopup() {
    this.showPopup = false;
    this.showProfile = false;
    this.showEditMode = false;
    this.showLogout = false;
  }

  async saveEditings(editForm: FormGroup, newAvatarUrl: string) {
    const email = editForm.value.email;
    const name = editForm.value.fullName;
    await this.authService.updateEditInCloud(email, name, newAvatarUrl);
    this.toggleProfileDisplay();
  }
}
