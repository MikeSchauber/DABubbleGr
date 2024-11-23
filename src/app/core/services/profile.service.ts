import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  showPopup: boolean = false;
  showProfile: boolean = false;
  showLogout: boolean = false;

  constructor() {}

  preventDefault(e: MouseEvent) {
    e.stopPropagation();
  }

  toggleProfileDisplay() {
    this.showLogout = false;
    this.showProfile = true;
    if (!this.showPopup) {
      this.showPopup = !this.showPopup;
    }
  }

  toggleLogoutDisplay() {
    this.showProfile = false;
    this.showLogout = true;
    this.showPopup = !this.showPopup;
  }

  closePopup() {
    this.showPopup = false;
    this.showProfile = false;
    this.showLogout = false;
  }
}
