import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CloudService } from '../../../core/services/cloud.service';
import { InfoFlyerService } from '../../../core/services/info-flyer.service';
import { updateDoc } from '@angular/fire/firestore';
import { AuthStyleService } from '../../../core/services/auth-style.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-add-avatar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './add-avatar.component.html',
  styleUrl: './add-avatar.component.scss',
})
export class AddAvatarComponent {

  @ViewChild('fileInput') fileInput: ElementRef | undefined; // Referenz auf das file input
  newAvatarUrl: string = 'assets/basic-avatars/default-avatar.svg';
  avatarPaths: string[] = [
    'assets/basic-avatars/avatar1.svg',
    'assets/basic-avatars/avatar2.svg',
    'assets/basic-avatars/avatar3.svg',
    'assets/basic-avatars/avatar4.svg',
    'assets/basic-avatars/avatar5.svg',
    'assets/basic-avatars/avatar6.svg',
  ];
  currentUserCollectionId: string | undefined = '';
  currentUser: { uid: string } | null = null;

  constructor(
    public authService: AuthService,
    public authStyle: AuthStyleService,
    public cloudService: CloudService,
    private router: Router,
    private infoService: InfoFlyerService,
    public profileService: ProfileService
  ) {}

  /**
   * Triggers a click event on the file input element.
   */
  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  /**
   * Handles the file selection event and processes the selected file.

   * @param {any} event - The file selection event containing the selected file.
   */
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        const dataUrl = await this.profileService.readFileAsDataUrl(file);
        this.newAvatarUrl = dataUrl;
      } catch (error) {
        console.error('Fehler beim Auswählen der Datei:', error);
      }
    }
  }

  /**
   * Updates the selected avatar URL path.
   * @param {string} path - The new avatar URL path.
   */
  changeSelectedPath(path: string) {
    this.newAvatarUrl = path;
  }

  /**
   * Changes the avatar URL for the currently authenticated user.
   * If the user exists, attempts to update their avatar.
   */
  async changeAvatarUrl() {
    if (this.authService.auth.currentUser != null) {
      let userId = await this.authService.getCurrentUserId();
      await this.tryUpdateAvatarIfUserExists(userId);
    }
    this.cloudService.loading = false;
  }

  /**
   * Attempts to update the avatar for an existing user.
   * @param {string} userId - The ID of the user whose avatar should be updated.
   */
  async tryUpdateAvatarIfUserExists(userId: string) {
    try {
      this.cloudService.loading = true;
      await this.updateMemberAvatar(userId);
      this.router.navigate(['/dashboard']);
      this.infoService.createInfo('Avatar erfolgreich geändert', false);
    } catch {
      this.infoService.createInfo('Avatar konnte nicht geändert werden', true);
    }
  }

  /**
   * Updates the member's avatar in the database and refreshes the local storage data.
   * @param {string} id - The ID of the member whose avatar is being updated.
   */
  async updateMemberAvatar(id: string) {
    const memberRef = this.cloudService.getSingleDoc('publicUserData', id);
    await updateDoc(memberRef, {
      avatarUrl: this.newAvatarUrl,
    });
    await this.authService.createCurrentUserDataInLocalStorage();
    await this.authService.loadCurrentUserDataFromLocalStorage();
  }

}
