import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-display-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-profile.component.html',
  styleUrls: ['./display-profile.component.scss'],
})
export class DisplayProfileComponent {
  closeButton: string = 'assets/icons/close.svg';

  constructor(public profileService: ProfileService) {}

  changeCloseButton(path: string) {
    setTimeout(() => {
      this.closeButton = path;
    }, 75);
  }
}
