import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChannelService } from '../../../../core/services/channel.service';
import { MemberService } from '../../../../core/services/member.service'; 
import { User } from '../../../../models/interfaces/user.interface';
import { UserService } from '../../../../core/services/user.service';
import { Observable, of, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-edit-members-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-members-popup.component.html',
  styleUrls: ['./edit-members-popup.component.scss']
})
export class EditMembersPopupComponent implements OnInit {
  @Input() channelId!: string;
  @Input() channelName!: string;
  @Input() memberIds: string[] = [];
  @Input() users: User[] = [];

  @Output() closePopup = new EventEmitter<void>();
  @Output() membersUpdated = new EventEmitter<string[]>();

  private destroy$ = new Subject<void>(); // Emits when the component is destroyed
  channelMembers$!: Observable<User[]>;

  enrichedMembers: { id: string; displayName: string; avatarUrl: string; userStatus: string }[] = [];
  isAddMemberPopupOpen: boolean = false; // Controls the popup visibility
  newMemberName: string = ''; // Holds the input for the new member
  isDropdownOpen = false;
  selectedUserNames: Set<string> = new Set<string>();
  searchText = ''; 
  filteredUsers: User[] = [];
  selectedUserIds: Set<string> = new Set<string>();


  constructor(private memberService: MemberService, private channelService: ChannelService, private userService: UserService) {}

  ngOnInit() {
    this.loadMemberDetails();
    this.userService.getUsers().subscribe((users) => {
      this.users = users;
      this.filteredUsers = [...this.users]; // Initiale Filterung
      console.log('Alle Benutzer geladen:', this.users);
    });
    this.memberService.channelMembers$
    .pipe(takeUntil(this.destroy$)) // Clean up subscription on component destroy
    .subscribe((members: User[]) => {
      console.log('Channel Members:', members);
      // Update the local state or use it directly in the template
      this.channelMembers$ = of(members); // Optionally reassign Observable for async pipe
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Loads member details from the member service
  loadMemberDetails() {
    this.enrichedMembers = [];
    this.memberIds.forEach((memberId) => {
      this.memberService.getMemberById(memberId).then((member) => {
        if (member) {
          this.enrichedMembers.push({
            id: memberId,
            displayName: member.displayName,
            avatarUrl: member.avatarUrl,
            userStatus: member.userStatus || 'offline' // Default to offline if status is missing
          });
        }
      });
    });
  }

  // Opens the Add Member popup
  openAddMemberPopup() {
    this.isAddMemberPopupOpen = true;
  }

  // Closes the Add Member popup
  closeAddMemberPopup() {
    this.isAddMemberPopupOpen = false;
  }

  // Adds a new member to the channel
  addMember() {
    if (this.newMemberName.trim()) {
      const newMember = {
        id: Date.now().toString(), // Generate a unique ID
        displayName: this.newMemberName,
        avatarUrl: '/assets/default-avatar.png', // Default avatar URL
        userStatus: 'offline' // Default status
      };

      this.enrichedMembers.push(newMember); // Add the new member to the enriched list
      this.newMemberName = ''; // Clear the input field
      this.closeAddMemberPopup(); // Close the popup
    } else {
      alert('Bitte geben Sie einen Namen ein!'); // Alert for empty input
    }
  }

  // Removes a member from the channel
  async removeMember(memberId: string) {
    this.memberIds = this.memberIds.filter((id) => id !== memberId);
    this.enrichedMembers = this.enrichedMembers.filter((member) => member.id !== memberId);
   await  this.channelService.removeMemberFromChannel(this.channelId, memberId)
  }

  // Closes the main popup and emits the updated members
  close() {
    this.membersUpdated.emit(this.memberIds);
    this.closePopup.emit();
  }


  // Dropdown and selection management
  toggleDropdown(isOpen: boolean): void {
    this.isDropdownOpen = isOpen;
    if (isOpen) {
      this.filteredUsers = [...this.users]; // Dropdown öffnen und alle Benutzer anzeigen
    }
  }

/**
   * Filtert die Benutzer basierend auf der Eingabe
   */
filterUsers(): void {
  const query = this.searchText.toLowerCase();
  if (!query.trim()) {
    this.filteredUsers = [...this.users]; // Zeige alle Benutzer an, wenn der Suchtext leer ist
  } else {
    this.filteredUsers = this.users.filter((user) =>
      user.name.toLowerCase().includes(query)
    );
  }
}


/**
   * Fügt einen Benutzer zu den ausgewählten Benutzern hinzu/entfernt ihn
   */
toggleUserSelection(userId: string): void {
  if (this.selectedUserIds.has(userId)) {
    this.selectedUserIds.delete(userId);
  } else {
    this.selectedUserIds.add(userId);
  }
}


 /**
   * Fügt Benutzer anhand des Namens hinzu
   */
  addUserByName(): void {
    const matchingUser = this.filteredUsers.find(
      (user) => user.name.toLowerCase() === this.newMemberName.toLowerCase()
    );
    if (matchingUser) {
      this.selectedUserNames.add(matchingUser.name);
      console.log('Benutzer hinzugefügt:', matchingUser.name);
    } else {
      console.log('Kein Benutzer gefunden:', this.newMemberName);
    }
    this.newMemberName = ''; // Eingabefeld zurücksetzen
    this.isDropdownOpen = false; // Dropdown schließen
  }

  addSelectedUsers(): void {
    if (this.selectedUserIds.size === 0) return;

    const newMemberIds = Array.from(this.selectedUserIds);
    this.channelService
      .addMembersToChannel(this.channelId, newMemberIds)
      .then(() => {
        console.log('Members added successfully:', newMemberIds);
        this.memberIds = [...this.memberIds, ...newMemberIds]; // Update local members
        this.membersUpdated.emit(this.memberIds); // Notify parent component
        this.loadMemberDetails(); // Refresh enriched member details
        this.closePopup.emit(); // Close the popup
      })
      .catch((error) => console.error('Error adding members:', error));
  }

  closeDropdown(): void {
    setTimeout(() => (this.isDropdownOpen = false), 200); // Allow clicks on the dropdown
  }
}



