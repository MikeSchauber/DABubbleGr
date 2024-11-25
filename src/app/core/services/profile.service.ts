import { Injectable, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { User } from '../../models/user.class';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  showPopup: boolean = false;
  showProfile: boolean = false;
  showEditMode: boolean = false;
  showLogout: boolean = false;

  constructor() {
  }

  preventDefault(e: MouseEvent) {
    e.stopPropagation();
  }

  switchToEditProfile() {
    this.showEditMode = true;
    this.showProfile = false;
  }

  toggleProfileDisplay() {
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
}
