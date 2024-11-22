import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudService } from '../../../core/services/cloud.service';

@Component({
  selector: 'app-display-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-profile.component.html',
  styleUrls: ['./display-profile.component.scss'],
})
export class DisplayProfileComponent {


  constructor(public cloudService: CloudService) {}

  editProfile(event: Event) {
    event.preventDefault(); 
    console.log('Profil bearbeiten');
  }

  closeProfile() {
    console.log('Profil schließen');
  }

  showData() {
    console.log('channels', this.cloudService.channels);
    console.log('members', this.cloudService.members);
    console.log('ids', this.cloudService.memberPrivate);
  }

  // getStatusText() {
  //   return this.data.status === 'active' ? 'Aktiv' : 'Abwesend';
  // }
}
