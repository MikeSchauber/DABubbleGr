import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CloudService } from '../../../core/services/cloud.service';
import { User } from '../../../models/user.class';

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
    private router: Router
  ) {}

  changeSelectedPath(path: string) {
    this.selectedAvatar = path;
    this.cloudService.members.forEach((member: User) => {
      if (member.authId == this.authService.currentUser?.uid) {
        this.currentUserCollectionId = member.collectionId;
      }
    });
  }

  changeAvatarUrl() {
    if (
      this.currentUserCollectionId != undefined &&
      this.currentUserCollectionId.length > 0
    ) {
      try {
        this.cloudService.loading = true;
        this.authService.updateMemberAvatar(
          this.currentUserCollectionId,
          this.selectedAvatar
        );
        this.router.navigate(['/dashboard']);
        this.cloudService.loading = false;
      } catch (error) {
        console.error(error);
      }
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
