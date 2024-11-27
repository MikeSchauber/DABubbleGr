import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CloudService } from '../../../core/services/cloud.service';
import { InfoFlyerService } from '../../../core/services/info-flyer.service';
import { updateDoc } from 'firebase/firestore';

@Component({
  selector: 'app-add-avatar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './add-avatar.component.html',
  styleUrl: './add-avatar.component.scss',
})
export class AddAvatarComponent {
  avatarPaths: string[] = [
    'assets/basic-avatars/avatar1.svg',
    'assets/basic-avatars/avatar2.svg',
    'assets/basic-avatars/avatar3.svg',
    'assets/basic-avatars/avatar4.svg',
    'assets/basic-avatars/avatar5.svg',
    'assets/basic-avatars/avatar6.svg',
  ];
  selectedAvatar: string = 'assets/basic-avatars/default-avatar.svg';
  currentUserCollectionId: string | undefined = '';
  currentUser: { uid: string } | null = null;
  constructor(
    public authService: AuthService,
    private cloudService: CloudService,
    private router: Router,
    private infoService: InfoFlyerService
  ) {}

  changeSelectedPath(path: string) {
    this.selectedAvatar = path;
  }

  async changeAvatarUrl() {
    let userId = this.authService.getCurrentUserId();
    if (this.authService.auth.currentUser != null && userId.length > 0) {
      this.tryUpdateAvatarIfUserExists(userId);
    }
    this.cloudService.loading = false;
  }

  findUserId(): string {
    let userId = '';
    if (this.authService.auth.currentUser != null) {
      for (const member of this.cloudService.publicUserData) {
        if (member.authId == this.authService.auth.currentUser.uid) {
          userId = member.collectionId;
        }
      }
    } else {
      this.infoService.createInfo('Du bist nicht eingeloggt', true);
    }
    return userId;
  }

  tryUpdateAvatarIfUserExists(userId: string) {
    try {
      this.cloudService.loading = true;
      this.updateMemberAvatar(userId, this.selectedAvatar);
      this.router.navigate(['/dashboard']);
      this.infoService.createInfo('Avatar wurde erfolgreich erstellt', false);
    } catch {
      this.infoService.createInfo('Avatar konnte nicht geändert werden', true);
      this.router.navigate(['/dashboard']);
    }
  }

  async updateMemberAvatar(id: string, path: string) {
    const memberRef = this.cloudService.getSingleDoc('publicUserData', id);
    await updateDoc(memberRef, {
      avatarUrl: path,
    });
  }
}
