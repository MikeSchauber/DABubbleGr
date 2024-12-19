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

  /** Handles the touch start event and stores the starting Y position of the touch.
   * @param {TouchEvent} event - The touch start event. */
  onTouchStart(event: TouchEvent): void {
    this.touchStartY = event.touches[0].clientY;
  }

  /** Handles the touch move event and stores the current Y position of the touch.
   * @param {TouchEvent} event - The touch move event. */
  onTouchMove(event: TouchEvent): void {
    this.touchEndY = event.touches[0].clientY;
  }

  /** Handles the touch end event and checks if the swipe distance exceeds a threshold to trigger
   * the closing of the logout Popup. */
  onTouchEnd(): void {
    const swipeDistance = this.touchEndY - this.touchStartY;
    if (swipeDistance > 60) {
      this.profileService.closePopup();
    }
  }
}
