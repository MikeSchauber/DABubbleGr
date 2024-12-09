import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';


@Component({
  selector: 'app-display-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-profile.component.html',
  styleUrls: ['./display-profile.component.scss'],
})
export class DisplayProfileComponent {
  closeButton: string = 'assets/icons/close.svg';

  constructor(
    public profileService: ProfileService,
    public authService: AuthService
  ) {}
}
