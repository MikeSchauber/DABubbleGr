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
  @Input() data: any; // Eingabe-Property für `data` hinzufügen
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() saveEdit = new EventEmitter<void>();

  closeEditProfile() {
    console.log('Profil-Bearbeitungsansicht schließen');
    this.cancelEdit.emit(); 
  }

  cancelEditProfile() {
    console.log('Bearbeitung abgebrochen');
    this.cancelEdit.emit();
  }

  saveProfile() {
    console.log('Profil speichern');
    console.log('Neuer Name:', this.data.displayName);
    console.log('Neue E-Mail:', this.data.email);
    this.saveEdit.emit();
  }
}
