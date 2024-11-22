import { Component } from '@angular/core';
import { DisplayProfileComponent } from './display-profile/display-profile.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { CommonModule } from '@angular/common';
import { CloudService } from '../../core/services/cloud.service';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DisplayProfileComponent, EditProfileComponent, CommonModule], 
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  isEditing: boolean = false;

  // Beispiel-Daten (später ggf. aus einer Datenbank)
  data = {
    email: "fred.beck@email.com",
    displayName: "Frederik Beck",
    avatarUrl: "assets/basic-avatars/avatar1.svg",
    status: "active"
  };

  constructor(public cloudService: CloudService) {}
  showData() {
    console.log("channels", this.cloudService.channels);
    console.log("members", this.cloudService.members);
    console.log("ids", this.cloudService.memberPrivate);
  }
  startEditing() {
    console.log("Switching to edit mode...");
    this.isEditing = true;
  }

  stopEditing() {
    console.log("Exiting edit mode...");
    this.isEditing = false;
  }
}
