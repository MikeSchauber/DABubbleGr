import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CloudService } from '../../../core/services/cloud.service';
import { InfoFlyerService } from '../../../core/services/info-flyer.service';
import { updateDoc } from '@angular/fire/firestore';
import { AuthStyleService } from '../../../core/services/auth-style.service';

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
    public authStyle: AuthStyleService,
    private cloudService: CloudService,
    private router: Router,
    private infoService: InfoFlyerService
  ) {}

  changeSelectedPath(path: string) {
    this.selectedAvatar = path;
  }

  async changeAvatarUrl() {
    if (this.authService.auth.currentUser != null) {
      let userId = this.authService.getCurrentUserId();
      await this.tryUpdateAvatarIfUserExists(userId);
    }
    this.cloudService.loading = false;
  }

  async tryUpdateAvatarIfUserExists(userId: string) {
    try {
      this.cloudService.loading = true;
      await this.updateMemberAvatar(userId, this.selectedAvatar);
      this.router.navigate(['/dashboard']);
      this.infoService.createInfo('Avatar erfolgreich geändert', false);
      this.authService.changeOnlineStatus('online');
    } catch {
      this.infoService.createInfo('Avatar konnte nicht geändert werden', true);
    }
  }

  async updateMemberAvatar(id: string, path: string) {
    const memberRef = this.cloudService.getSingleDoc('publicUserData', id);
    await updateDoc(memberRef, {
      avatarUrl: path,
    });
  }
}
