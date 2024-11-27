import { Injectable, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { UserClass } from '../../models/user-class.class';
import { updateDoc } from 'firebase/firestore';
import { CloudService } from './cloud.service';
import { FormGroup } from '@angular/forms';
import { updateEmail } from 'firebase/auth';
import { InfoFlyerService } from './info-flyer.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  showPopup: boolean = true;
  showProfile: boolean = false;
  showEditMode: boolean = true;
  showLogout: boolean = false;

  constructor(
    private authService: AuthService,
    private cloudService: CloudService,
    private infoService: InfoFlyerService
  ) {}

  preventDefault(e: MouseEvent) {
    e.stopPropagation();
  }

  switchToEditProfile() {
    this.showEditMode = true;
    this.showProfile = false;
  }

  toggleProfileDisplay() {
    const userId = this.authService.getCurrentUserId();
    console.log(userId);
    
    this.authService.createCurrentUserData(userId);
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

  async saveEditings(editForm: FormGroup) {
    const email = editForm.value.email;
    const name = editForm.value.fullName;
    const userId = this.authService.getCurrentUserId();
    await this.authService.updateEditInCloud(email, name, userId);
    this.toggleProfileDisplay();
  }
}
