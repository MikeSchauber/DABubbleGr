import { Component } from '@angular/core';
import { DisplayProfileComponent } from './display-profile/display-profile.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { CommonModule } from '@angular/common';
import { CloudService } from '../../core/services/cloud.service';
import { LogoutDisplayComponent } from './logout-display/logout-display.component';
import { ProfileService } from '../../core/services/profile.service';
import { OtherProfileComponent } from './other-profile/other-profile.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    DisplayProfileComponent,
    EditProfileComponent,
    CommonModule,
    LogoutDisplayComponent,
   OtherProfileComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {

  constructor(
    public cloudService: CloudService,
    public profileService: ProfileService
  ) {}

}
