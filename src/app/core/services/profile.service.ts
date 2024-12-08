import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { FormGroup } from '@angular/forms';
import { InfoFlyerService } from './info-flyer.service';
import { DocumentData, getDoc } from '@angular/fire/firestore';
import { CloudService } from './cloud.service';
import { UserClass } from '../../models/user-class.class';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  showPopup: boolean = true;
  showProfile: boolean = false;
  showEditMode: boolean = false;
  showOther: boolean = false;
  showLogout: boolean = true;

  anotherUser!: UserClass;

  constructor(
    private authService: AuthService,
    private infoService: InfoFlyerService,
    private cloudService: CloudService
  ) {}

  preventDefault(e: MouseEvent) {
    e.stopPropagation();
  }

  switchToEditProfile() {
    this.showEditMode = true;
    this.showProfile = false;
    this.showOther = false;
  }

  toggleProfileDisplay() {
    this.authService.loadCurrentUserDataFromLocalStorage();
    this.showLogout = false;
    this.showEditMode = false;
    this.showOther = false;
    this.showProfile = true;
    if (!this.showPopup) {
      this.showPopup = !this.showPopup;
    }
  }

  toggleLogoutDisplay() {
    this.showProfile = false;
    this.showEditMode = false;
    this.showOther = false;
    this.showPopup = !this.showPopup;
    this.showLogout = true;
  }

  async toggleOtherDisplay(id: string) {
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

  async setUpOtherUserData(id: string) {
    try {
      const userDocRef = this.cloudService.getSingleDoc('publicUserData', id);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        this.anotherUser = this.returnUser(userDocSnap.data());
        console.log(this.anotherUser);
      } else {
        console.log('Kein Benutzer mit dieser ID gefunden!');
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzerdaten:', error);
    }
  }

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

  closePopup() {
    this.showPopup = false;
    this.showProfile = false;
    this.showEditMode = false;
    this.showLogout = false;
    this.showOther = false;
  }

  async saveEditings(editForm: FormGroup, newAvatarUrl: string) {
    const email = editForm.value.email;
    const name = editForm.value.fullName;
    await this.authService.updateEditInCloud(email, name, newAvatarUrl);
    this.toggleProfileDisplay();
  }

  readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const maxSizeInBytes = 250 * 1024; // 250 KB
      if (file.size > maxSizeInBytes) {
        this.infoService.createInfo(
          'Bilder dürfen nicht größer als 250kb sein',
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
