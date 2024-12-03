import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { User } from '../../../models/interfaces/user.interface';

@Component({
  selector: 'app-add-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-members.component.html',
  styleUrls: ['./add-members.component.scss'],
})
export class AddMembersComponent implements OnInit {
  @Input() users$!: Observable<User[]>; // Observable for all users
  @Input() data: { channelId: string; channelName: string } | null = null; // Channel data
  @Input() isMobileView = false; // Flag for mobile view

  @Output() closePopup = new EventEmitter<void>(); // Emits when popup closes
  @Output() addMembers = new EventEmitter<{ channelId: string; memberIds: string[] }>(); // Emits member IDs to add

  selectedOption: 'all' | 'specific' | null = null; // Option for selection
  selectedUserNames: Set<string> = new Set<string>(); // Selected user names
  users: User[] = []; // List of users
  isDropdownOpen = false; 
  filteredUsers: User[] = []; // Gefilterte Benutzer basierend auf Eingabe


  ngOnInit(): void {
    // Load and log users
    this.users$.subscribe((users) => {
      this.users = users;
      console.log('Loaded users in AddMembersComponent:', users);
    });
  }

  toggleDropdown(isOpen: boolean) {
    this.isDropdownOpen = isOpen;
  }

  filterUsers(value: string) {
    // Wenn das Eingabefeld leer ist, zeigen Sie alle Benutzer an
    if (!value) {
      this.filteredUsers = [...this.users]; // Kopie aller Benutzer
      return;
    }
  
    // Filtern der Benutzer basierend auf dem eingegebenen Namen
    this.users$.subscribe(users => {
      this.filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(value.toLowerCase())
      );
    });
  }
  onInput(event: Event) {
    const input = event.target as HTMLInputElement; // Typumwandlung
    const value = input?.value || ''; // Sicherstellen, dass value nicht null ist
    this.filterUsers(value); // Übergabe an die Filterlogik
  }
  
  

  selectUser(user: any) {
    if (!this.selectedUserNames.has(user.name)) {
      this.selectedUserNames.add(user.name);
    }
    this.toggleDropdown(false);
  }

  onBlur() {
    // Dropdown mit Verzögerung schließen, um Klicks auf Dropdown-Elemente zu ermöglichen
    setTimeout(() => this.toggleDropdown(false), 150);
  }
  // Change selection option
  selectOption(option: 'all' | 'specific'): void {
    this.selectedOption = option;
    if (option === 'all') {
      this.selectedUserNames.clear(); // Clear specific selection when 'all' is chosen
    }
  }

  // Toggle user selection
  toggleUserSelection(userName: string): void {
    this.selectedUserNames.has(userName)
      ? this.selectedUserNames.delete(userName)
      : this.selectedUserNames.add(userName);
    console.log('Current selection:', Array.from(this.selectedUserNames));
  }

  // Add members to the channel
  addMembersHandler(): void {
    if (!this.data?.channelId) {
      console.error('Channel ID is missing!');
      return;
    }

    const channelId = this.data.channelId;

    if (this.selectedOption === 'all') {
      // Get all user IDs
      const allUserIds = this.users.map((user) => user.authId).filter(Boolean);
      if (allUserIds.length === 0) {
        alert('No users available to add.');
        return;
      }
      console.log('All User IDs:', allUserIds);
      this.addMembers.emit({ channelId, memberIds: allUserIds });
    } else if (this.selectedOption === 'specific') {
      // Get selected user IDs
      const selectedUserIds = Array.from(this.selectedUserNames)
        .map((name) => this.users.find((user) => user.name === name)?.authId)
        .filter(Boolean) as string[];
      if (selectedUserIds.length === 0) {
        alert('Please select at least one user.');
        return;
      }
      console.log('Selected User IDs:', selectedUserIds);
      this.addMembers.emit({ channelId, memberIds: selectedUserIds });
    } else {
      alert('Please select an option.');
    }
  }

  // Close the popup
  handleClosePopup(): void {
    this.closePopup.emit();
  }
}
