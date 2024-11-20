import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { InfoFlyerService } from '../../../core/services/info-flyer.service';

@Component({
  selector: 'app-info-flyer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-flyer.component.html',
  styleUrl: './info-flyer.component.scss',
})
export class InfoFlyerComponent {
  constructor(
    public authService: AuthService,
    public flyerService: InfoFlyerService
  ) {}
}
