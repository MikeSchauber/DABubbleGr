import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent {

  closeEditProfile() {
    console.log('Profil-Bearbeitungsansicht schließen');

  }

  cancelEditProfile() {
    console.log('Bearbeitung abgebrochen');

  }

  saveProfile() {
    console.log('Profil speichern');
  }
}
