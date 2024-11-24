import { Injectable, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { User } from '../../models/user.class';

@Injectable({
  providedIn: 'root',
})
export class ProfileService implements OnInit {
  showPopup: boolean = false;
  showProfile: boolean = false;
  showLogout: boolean = false;

  currentUserName: string | null = '';
  currentUserEmail: string | null = '';
  currentUserStatus: string | null = '';
  currentUserAvatar: string | null = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.writeCurrentUserData();
  }

  writeCurrentUserData() {
    let currentUser: User = this.authService.getCurrentUserData();
    this.currentUserName = currentUser.displayName;
    this.currentUserEmail = currentUser.email;
    this.currentUserStatus = currentUser.userStatus;
    this.currentUserAvatar = currentUser.avatarUrl;
    console.log(currentUser);
  }

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
