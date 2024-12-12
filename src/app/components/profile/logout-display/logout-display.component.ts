import { Component } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-logout-display',
  standalone: true,
  imports: [],
  templateUrl: './logout-display.component.html',
  styleUrl: './logout-display.component.scss',
})
export class LogoutDisplayComponent {
  private touchStartY: number = 0;
  private touchEndY: number = 0;
  constructor(
    public profileService: ProfileService,
    public authService: AuthService
  ) {}

  onTouchStart(event: TouchEvent): void {
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchMove(event: TouchEvent): void {
    this.touchEndY = event.touches[0].clientY;
  }

  onTouchEnd(): void {
    const swipeDistance = this.touchEndY - this.touchStartY;
    if (swipeDistance > 60) {
      this.profileService.closePopup();
    }
  }
}
