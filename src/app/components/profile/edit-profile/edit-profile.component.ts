import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent {
  closeButton: string = 'assets/icons/close.svg';
  constructor(public profileService: ProfileService) {}

  changeCloseButton(path: string) {
    setTimeout(() => {
      this.closeButton = path;
    }, 75);
  }
}
