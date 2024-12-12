import { Component } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logout-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logout-display.component.html',
  styleUrl: './logout-display.component.scss',
})
export class LogoutDisplayComponent {
  touchStartY: number = 0;
  touchEndY: number = 0;
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
