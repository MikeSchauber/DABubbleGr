import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { ChannelService } from '../../../core/services/channel.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { User } from '../../../models/interfaces/user.interface'; 
import { HostListener } from '@angular/core'; 

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
  /** ====== Input Properties ====== **/ 
  @Input() users$!: Observable<User[]>; 
  @Input() data: { channelId: string; channelName: string } | null = null;
  @Input() isMobileView = false;

  /** ====== Output Events ====== **/
  @Output() closePopup = new EventEmitter<void>();
  @Output() addMembers = new EventEmitter<{ channelId: string; memberIds: string[] }>();

  /** ====== State Variables ====== **/
  selectedOption: 'all' | 'specific' | null = null;
  isDropdownOpen = false;
  newMemberName = ''; 

   /** ====== Observables and Subjects ====== **/ 
   channelMembers$ = new BehaviorSubject<User[]>([]);   

   selectedUserNames: Set<string> = new Set<string>(); 
   selectedUserIds = new Set<string>();
   filteredUsers$: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);
   hoveredUserIndex: number = -1;

   private destroy$ = new Subject<void>(); 
   private allUsers: User[] = [];
  
   constructor(private channelService: ChannelService) {}
   filteredUsers: User[] = [];

   /** ====== Lifecycle Hooks ====== **/
   ngOnInit(): void {
      this.users$.subscribe((users) => {
       this.allUsers = users;
       this.filteredUsers$.next(users); 
     });
   }
 
   ngOnDestroy(): void {
     this.cleanupSubscriptions();
   }
 
   /** ====== Host Listeners ====== **/
   @HostListener('window:resize')
   onResize(): void {
     this.isMobileView = window.innerWidth <= 950;
   }
 
   /** ====== State Management ====== **/
   toggleDropdown(isOpen: boolean): void {
     this.isDropdownOpen = isOpen;
   }
  
   /** ====== Filtering and Selection ====== **/
   filterUsers(event: Event): void {
    const input = (event.target as HTMLInputElement).value.toLowerCase();
    this.newMemberName = input;  
  
    const nonMembers = this.allUsers.filter(
      (user) =>
        !this.channelMembers$.getValue().some(
          (member) => member.publicUserId === user.publicUserId
        )
    );
  
    const filtered = input
      ? nonMembers.filter((user) =>
          user.displayName.toLowerCase().includes(input)
        )
      : nonMembers;
  
    this.filteredUsers$.next(filtered); // Update the filtered users
  }
  
  isUserHighlighted(user: User): boolean {
    const currentHoveredUser = this.filteredUsers$.getValue()[this.hoveredUserIndex];
    return currentHoveredUser?.publicUserId === user.publicUserId;
  }
  
   /**
   * Handles input event to filter users.
   * @param event - Input event from the search field.
   */
   onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input?.value || '';
    const inputEvent = new Event('input');
    (inputEvent.target as HTMLInputElement).value = value;
    this.filterUsers(event);
  }

  /**
   * Selects a user and closes the dropdown.
   * @param user - The selected user.
   */
  selectUser(user: User): void {
    if (!this.selectedUserNames.has(user.displayName)) {
      this.selectedUserNames.add(user.displayName);
    }
    this.toggleDropdown(false);
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
      this.selectedUserIds.clear(); // Clear specific selections
    }
  }
  

  /**
   * Toggles user selection in the specific selection mode.
   * @param userName - Name of the user to toggle.
   */
  toggleUserSelection(userId: string): void {
    if (this.selectedUserIds.has(userId)) {
      this.selectedUserIds.delete(userId);
    } else {
      this.selectedUserIds.add(userId);
    }
  
  /**
  * Ensures that the entire list of non-members is updated and displayed.
  * Filters out users who are already members of the channel.
  */ 
  this.users$.subscribe((users) => {
    const allUsers = users;
    const nonMembers = this.allUsers.filter(
      (user) => !this.channelMembers$.getValue().some((member) => member.publicUserId === user.publicUserId)
    );
    this.filteredUsers$.next(nonMembers);
  });
  const nonMembers = this.allUsers.filter(
    (user) => !this.channelMembers$.getValue().some((member) => member.publicUserId === user.publicUserId)
  );

  this.filteredUsers$.next(nonMembers);
  this.newMemberName = '';
  }

  /**
  * Adds a user by their name from the input field.
  * If the user matches the input, adds them to the selected list.
  */
   addUserByName(): void {
     const inputName = this.newMemberName.toLowerCase().trim();
     if (!inputName) return;
 
     const matchingUser = this.allUsers.find((user) =>
       user.displayName.toLowerCase().startsWith(inputName)
     );
 
     if (matchingUser) {
       this.selectedUserIds.add(matchingUser.publicUserId);
       this.newMemberName = ''; // Clear input field
       alert(`User "${matchingUser.displayName}" added.`);
     } else {
       alert('No user found.');
     }
 
     this.isDropdownOpen = false; // Close dropdown
   }
 
  /**
  * Handles the addition of selected members to the channel.
  * Adds either all users or only the specifically selected ones, based on the selected option.
  */
   addMembersHandler(): void {
    if (!this.data?.channelId) {
      console.error('Channel ID is missing!');
      return;
    }
  
    const channelId = this.data.channelId;
  
    if (this.selectedOption === 'all') {
      const allUserIds = this.allUsers.map((user) => user.publicUserId);
      if (!allUserIds.length) {
        alert('No users available to add.');
        return;
      }
      this.addMembers.emit({ channelId, memberIds: allUserIds });

       // Add specific users if "specific" option is selected
    } else if (this.selectedOption === 'specific') {
      const selectedUserIds = Array.from(this.selectedUserIds);
      if (!selectedUserIds.length) {
        alert('Please select at least one user.');
        return;
      }
      this.addMembers.emit({ channelId, memberIds: selectedUserIds });
    } else {
      alert('Please select an option.');
    }
    // Refresh the channel view after adding members
    this.channelService.displayChannel(channelId);
  }
  
  /**
  * Cleans up subscriptions to prevent memory leaks when the component is destroyed.
  */
  cleanupSubscriptions(): void {
    this.destroy$.next();
    this.destroy$.complete();
   }
   
  /**
  * Closes the popup by emitting the `closePopup` event.
  */
  handleClosePopup(): void {
    this.closePopup.emit();
    }
  }