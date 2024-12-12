interface EnhancedUser extends User {
  conversationId: string;  // Always a string after generation
  messageCount: number;    // Always a number, defaults to 0 if no channel found
}

import { Injectable } from '@angular/core';
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
export class ProfileService {
  private destroy$ = new Subject<void>();

  showPopup: boolean = true;
  showProfile: boolean = false;
  showEditMode: boolean = false;
  showOther: boolean = false;
  showLogout: boolean = true;
  public anotherUserSubject = new BehaviorSubject<EnhancedUser | undefined>(undefined);
  anotherUser$ = this.anotherUserSubject.asObservable(); // Expose as Observable

  constructor(
    private authService: AuthService,
    private infoService: InfoFlyerService,
    private cloudService: CloudService,
    public searchService: SearchService,
    public userService: UserService
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

  // setUpOtherUserData(id: string) {
  //   this.userService.enhancedUsers$
  //     .pipe(
  //       takeUntil(this.destroy$) // Automatically unsubscribe on destroy
  //     )
  //     .subscribe((users) => {
  //       this.anotherUser = users?.find((user) => user.publicUserId === id);
  //     });
  // }

  setUpOtherUserData(id: string) {
    this.userService.enhancedUsers$
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => {
        const user = users?.find((user) => user.publicUserId === id);
        this.anotherUserSubject.next(user); // Emit new value
      });
      // console.log(this.anotherUserSubject);
      
  }

  ngOnDestroy(): void {
    // Emit and complete the destroy Subject
    this.destroy$.next();
    this.destroy$.complete();
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
