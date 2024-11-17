import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { CloudService } from '../../../core/services/cloud.service';

@Component({
  selector: 'app-display-profile',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './display-profile.component.html',
  styleUrls: ['./display-profile.component.scss']
})
export class DisplayProfileComponent {
  
  // Beispiel-Daten (später aus der DB)
  data = {
    email: "fred.beck@email.com",
    displayName: "Frederik Beck",
    avatarUrl: "assets/basic-avatars/avatar-1.png",
    status: "active" 
  };

  constructor(public cloudService: CloudService) {}

  editProfile() {
    console.log('Profil bearbeiten');
  }

  closeProfile() {
    console.log('Profil schließen');
  }

  showData() {
    console.log("channels", this.cloudService.channels);
    console.log("members", this.cloudService.members);
    console.log("ids", this.cloudService.ids);
  }

  
  getStatusText() {
    return this.data.status === 'active' ? 'Aktiv' : 'Abwesend';
  }
}
