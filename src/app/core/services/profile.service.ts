interface EnhancedUser extends User {
  conversationId: string; // Always a string after generation
  messageCount: number; // Always a number, defaults to 0 if no channel found
}

import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { FormGroup } from '@angular/forms';
import { InfoFlyerService } from './info-flyer.service';
import { DocumentData, getDoc } from '@angular/fire/firestore';
import { CloudService } from './cloud.service';
import { UserClass } from '../../models/user-class.class';
import { SearchService } from './search.service';
import { UserService } from './user.service';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { User } from '../../models/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class ProfileService implements OnDestroy {
  private destroy$ = new Subject<void>();

  showPopup: boolean = false;
  showProfile: boolean = false;
  showEditMode: boolean = false;
  showOther: boolean = false;
  showLogout: boolean = false;
  closingAnimation: boolean = false;
  public anotherUserSubject = new BehaviorSubject<EnhancedUser | undefined>(
    undefined
  );
  anotherUser$ = this.anotherUserSubject.asObservable(); // Expose as Observable

  constructor(
    private authService: AuthService,
    private infoService: InfoFlyerService,
    public searchService: SearchService,
    public userService: UserService
  ) {}

/**
 * Cleans up resources by completing the `destroy$` observable.
 * This ensures no memory leaks occur when the component is destroyed.
 */
ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

/**
 * Prevents the default behavior of an event and stops its propagation.
 * @param {MouseEvent} e The mouse event to stop.
 */
preventDefault(e: MouseEvent) {
  e.stopPropagation();
}

/**
 * Switches the current view to the edit profile mode.
 */
switchToEditProfile() {
  this.showEditMode = true;
  this.showProfile = false;
  this.showOther = false;
}

/**
 * Toggles the profile display and ensures the popup is visible.
 */
toggleProfileDisplay() {
  this.showLogout = false;
  this.showEditMode = false;
  this.showOther = false;
  this.showProfile = true;
  if (!this.showPopup) {
    this.showPopup = !this.showPopup;
  }
}

/**
 * Toggles the logout display and ensures the popup is visible.
 */
toggleLogoutDisplay() {
  this.showProfile = false;
  this.showEditMode = false;
  this.showOther = false;
  this.showPopup = !this.showPopup;
  this.showLogout = true;
}

/**
 * Toggles the display of another user's profile.
 * Sets up the other user's data when the popup is shown.
 * @async
 * @param {string} id The ID of the user to display.
 */
async toggleOtherDisplay(id: string) {
  this.searchService.searchQuery = '';
  if (!this.showPopup) {
    await this.setUpOtherUserData(id);
    this.showPopup = true;
  } else {
    this.showPopup = false;
  }
  this.showProfile = false;
  this.showEditMode = false;
  this.showOther = true;
  this.showLogout = false;
}

/**
 * Sets up the data for another user by subscribing to the user service.
 * Emits the user data through `anotherUserSubject`.
 * @async
 * @param {string} id The ID of the user to fetch.
 */
async setUpOtherUserData(id: string) {
  this.userService.enhancedUsers$
    .pipe(takeUntil(this.destroy$))
    .subscribe((users) => {
      const user = users?.find((user) => user.publicUserId === id);
      this.anotherUserSubject.next(user); // Emit new value
    });
}

/**
 * Creates and returns a new `UserClass` instance using the provided user data.
 * @param {DocumentData} user The user data retrieved from the database.
 * @returns {UserClass} A new instance of the `UserClass` with the provided data.
 */
returnUser(user: DocumentData): UserClass {
  return new UserClass(
    user['accountEmail'],
    user['displayEmail'],
    user['displayName'],
    user['userStatus'],
    user['avatarUrl'],
    user['createdAt'],
    user['updatedAt'],
    user['publicUserId']
  );
}

/**
 * Closes the popup with a closing animation.
 * Ensures all related views (profile, edit mode, logout, etc.) are hidden.
 */
closePopup() {
  this.closingAnimation = true;
  setTimeout(() => {
    this.showPopup = false;
    this.showProfile = false;
    this.showEditMode = false;
    this.showLogout = false;
    this.showOther = false;
    this.closingAnimation = false;
  }, 125);
}

/**
 * Saves the edited user profile data, including email, name, and avatar.
 * Updates the data in the cloud and toggles back to the profile display.
 * @async
 * @param {FormGroup} editForm The form containing updated user data.
 * @param {string} newAvatarUrl The new avatar URL to update.
 */
async saveEditings(editForm: FormGroup, newAvatarUrl: string) {
  const email = editForm.value.email;
  const name = editForm.value.fullName;
  await this.authService.updateEditInCloud(email, name, newAvatarUrl);
  this.toggleProfileDisplay();
}

/**
 * Reads a file as a Data URL and ensures the file does not exceed the size limit (500 KB).
 * Displays an error message if the file is too large.
 * @param {File} file The file to be read as a Data URL.
 * @returns {Promise<string>} Resolves with the file's Data URL if successful.
 */
readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const maxSizeInBytes = 500 * 1024; // 500 KB
    if (file.size > maxSizeInBytes) {
      this.infoService.createInfo(
        'Bilder dürfen nicht größer als 0,5Mb sein',
        true
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

}
