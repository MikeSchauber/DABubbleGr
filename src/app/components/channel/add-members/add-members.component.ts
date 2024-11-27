import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  name: string;
  avatar: string;
  userStatus: 'active' | 'away';
  authId: string;
}

@Component({
  selector: 'app-add-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-members.component.html',
  styleUrls: ['./add-members.component.scss'],
})
export class AddMembersComponent {
  @Input() newChannelId: string = ''; // ID des neuen Kanals
  @Input() newChannelName: string = ''; // Name des neuen Kanals
  @Input() users: User[] = []; // Alle Benutzer, die zur Auswahl stehen

  @Output() closePopup = new EventEmitter<void>(); // Schließt das Popup
  @Output() addMembers = new EventEmitter<string[]>(); // Emitiert die hinzugefügten Mitglieder

  selectedOption: 'all' | 'specific' | null = null; // Auswahloption (alle oder spezifisch)
  selectedUserNames: Set<string> = new Set<string>(); // Set zur Auswahl spezifischer Benutzer

  // Auswahloption ändern
  selectOption(option: 'all' | 'specific'): void {
    this.selectedOption = option;
    if (option === 'all') {
      this.selectedUserNames.clear(); // Falls "alle" gewählt wird, spezifische Auswahl zurücksetzen
    }
  }

  // Fügt einen spezifischen Benutzer zur Auswahl hinzu/entfernt ihn
  toggleUserSelection(userName: string): void {
    this.selectedUserNames.has(userName)
      ? this.selectedUserNames.delete(userName)
      : this.selectedUserNames.add(userName);
    console.log('Aktuelle Auswahl:', Array.from(this.selectedUserNames));
  }

  // Benutzer hinzufügen
  addMembersHandler(): void {
    if (this.selectedOption === 'all') {
      const allUserIds = this.users.map((user) => user.authId);
      console.log('Alle Benutzer-IDs:', allUserIds); // Debug-Ausgabe
      if (allUserIds.some(id => id === undefined)) {
        console.error('Ungültige Benutzer-IDs in der Liste:', allUserIds);
        return;
      }
      this.addMembers.emit(allUserIds);
    } else if (this.selectedOption === 'specific') {
      const selectedUserIds = Array.from(this.selectedUserNames)
        .map(name => this.users.find(user => user.name === name)?.authId)
        .filter(authId => authId !== undefined);
      console.log('Ausgewählte Benutzer-IDs:', selectedUserIds); // Debug-Ausgabe
      if (selectedUserIds.length === 0) {
        alert('Bitte wähle mindestens einen Benutzer aus.');
        return;
      }
      this.addMembers.emit(selectedUserIds);
    }
  }
  

  // Popup schließen
  handleClosePopup(): void {
    this.closePopup.emit();
  }

  // Fehler anzeigen
  private showError(message: string): void {
    console.error(message);
    alert(message);
  }
}
