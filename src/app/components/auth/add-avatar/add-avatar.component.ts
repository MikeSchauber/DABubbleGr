import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CloudService } from '../../../core/services/cloud.service';
import { User } from '../../../models/user.class';
import { InfoFlyerService } from '../../../core/services/info-flyer.service';

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
    let userId = this.findUserId();
    if (this.authService.user != null && userId.length > 0) {
      this.tryUpdateAvatarIfUserExists(userId);
    } else {
      this.router.navigate(['/login']);
      this.infoService.createInfo(
        'Es ist etwas Schiefgelaufen, Bitte erneut versuchen',
        true
      );
    }
    this.cloudService.loading = false;
  }

  findUserId(): string {
    let userId = '';
    if (this.authService.user != null) {
      for (const member of this.cloudService.members) {
        if (member.authId == this.authService.user.uid) {
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
      this.authService.updateMemberAvatar(userId, this.selectedAvatar);
      this.router.navigate(['/dashboard']);
      this.infoService.createInfo('Avatar wurde erfolgreich erstellt', false);
    } catch {
      this.infoService.createInfo('Avatar konnte nicht geändert werden', true);
      this.router.navigate(['/dashboard']);
    }
  }
}
