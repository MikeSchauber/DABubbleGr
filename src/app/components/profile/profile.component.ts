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
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  isEditing: boolean = false; // Steuert den Bearbeitungsmodus

  // Beispiel-Daten (könnten später aus einer Datenbank geladen werden)
  data = {
    email: 'fred.beck@email.com',
    displayName: 'Frederik Beck',
    avatarUrl: '/assets/basic-avatars/avatar1.svg',
    status: 'active',
  };

  constructor(public cloudService: CloudService) {}
  
  /**
   * Wechselt in den Bearbeitungsmodus.
   */
  startEditing(): void {
    console.log('Switching to edit mode...');
    this.isEditing = true;
  }

  /**
   * Beendet den Bearbeitungsmodus.
   */
  stopEditing(): void {
    console.log('Exiting edit mode...');
    this.isEditing = false;
  }

  /**
   * Speichert Änderungen und beendet den Bearbeitungsmodus.
   * @param updatedData - Die aktualisierten Profildaten.
   */
  onSave(updatedData: any): void {
    console.log('Saving updated data:', updatedData);
    this.data = { ...this.data, ...updatedData };
    this.stopEditing();
  }
}