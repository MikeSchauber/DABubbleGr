import { Component } from '@angular/core';
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

  data = {
    displayName: "Frederik Beck",
    email: "fred.beck@email.com",
    avatarUrl: "assets/basic-avatars/avatar-1.png"
  };

  closeEditProfile() {
    console.log('Profil-Bearbeitungsansicht schließen');
  }


  saveProfile() {
    console.log('Profil speichern');
    console.log('Neuer Name:', this.data.displayName);
    console.log('Neue E-Mail:', this.data.email);
  }
}
