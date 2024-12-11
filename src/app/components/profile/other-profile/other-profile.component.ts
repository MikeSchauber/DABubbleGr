import { Component } from '@angular/core';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-other-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './other-profile.component.html',
  styleUrl: './other-profile.component.scss',
})
export class OtherProfileComponent {
  constructor(
    public profileService: ProfileService,
    public authService: AuthService,
    public userService: UserService
  ) {}

  openPrivateChat(conversationId: string, publicUserId: string) {
    this.userService.openPrivateChat(conversationId, publicUserId);
    this.profileService.closePopup();
  }
}
