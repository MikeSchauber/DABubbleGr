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
  constructor(
    public profileService: ProfileService,
    public authService: AuthService
  ) {}
}
