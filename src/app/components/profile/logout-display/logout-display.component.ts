import { Component } from '@angular/core';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';

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
