import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { ChannelService } from '../../../core/services/channel.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { User } from '../../../models/interfaces/user.interface'; 

/**
 * @class AddMembersComponent
 * @description Allows adding members to a channel, with options for selecting all users or specific users.
 */
@Component({
  selector: 'app-add-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-members.component.html',
  styleUrls: ['./add-members.component.scss'],
})
export class AddMembersComponent implements OnInit {
  /** Observable of all available users */
  @Input() users$!: Observable<User[]>;

  /** Data for the current channel */
  @Input() data: { channelId: string; channelName: string } | null = null;

  /** Indicates whether the component is in mobile view */
  @Input() isMobileView = false;

  /** Emits when the popup is closed */
  @Output() closePopup = new EventEmitter<void>();

  /** Emits the selected members to be added to the channel */
  @Output() addMembers = new EventEmitter<{ channelId: string; memberIds: string[] }>();

  /** Selection option ('all' or 'specific') */
  selectedOption: 'all' | 'specific' | null = null;

  /** Set of selected user names */
  selectedUserNames: Set<string> = new Set<string>();

  /** List of all users */
  users: User[] = [];

  /** Tracks if the dropdown is open */
  isDropdownOpen = false;
  /** List of users filtered based on input */

  constructor(private channelService: ChannelService) {}
  filteredUsers: User[] = [];

  ngOnInit(): void {
    // Subscribe to user data and initialize users list
    this.users$.subscribe((users) => {
      this.users = users;
      console.log('Loaded users in AddMembersComponent:', users);
    });
  }

  /**
   * Toggles the visibility of the dropdown.
   * @param isOpen - Boolean indicating whether to open the dropdown.
   */
  toggleDropdown(isOpen: boolean): void {
    this.isDropdownOpen = isOpen;
  }

  /**
   * Filters the users based on the input value.
   * @param value - The input value to filter users by.
   */
  filterUsers(value: string): void {
    if (!value) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter((user) =>
      user.name.toLowerCase().includes(value.toLowerCase())
    );
  }

  /**
   * Handles input event to filter users.
   * @param event - Input event from the search field.
   */
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input?.value || '';
    this.filterUsers(value);
  }

  /**
   * Selects a user and closes the dropdown.
   * @param user - The selected user.
   */
  selectUser(user: User): void {
    if (!this.selectedUserNames.has(user.name)) {
      this.selectedUserNames.add(user.name); 
    } 
  }

  /**
   * Handles blur event to close the dropdown with a delay.
   */
  onBlur(): void {
    setTimeout(() => this.toggleDropdown(false), 150);
  }

  /**
   * Changes the selection option.
   * @param option - 'all' or 'specific'.
   */
  selectOption(option: 'all' | 'specific'): void {
    this.selectedOption = option;
    if (option === 'all') {
      this.selectedUserNames.clear(); // Clear specific selections
    }
  }

  /**
   * Toggles user selection in the specific selection mode.
   * @param userName - Name of the user to toggle.
   */
  toggleUserSelection(userName: string): void {
    if (this.selectedUserNames.has(userName)) {
      this.selectedUserNames.delete(userName);
    } else {
      this.selectedUserNames.add(userName);
    }
    console.log('Current selection:', Array.from(this.selectedUserNames));
  }

  /**
   * Adds members to the channel based on the selected option.
   */
  addMembersHandler(): void {
    if (!this.data?.channelId) {
      console.error('Channel ID is missing!');
      return;
    }

    const channelId = this.data.channelId;

    if (this.selectedOption === 'all') {
      const allUserIds = this.users.map((user) => user.authId).filter(Boolean);
      if (allUserIds.length === 0) {
        alert('No users available to add.');
        return;
      }
      console.log('All User IDs:', allUserIds);
      this.addMembers.emit({ channelId, memberIds: allUserIds });
    } else if (this.selectedOption === 'specific') {
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
      // Set the current channel after adding members
  this.channelService.displayChannel(channelId);
  }

  /**
   * Closes the popup.
   */
  handleClosePopup(): void {
    this.closePopup.emit();
  }
}
