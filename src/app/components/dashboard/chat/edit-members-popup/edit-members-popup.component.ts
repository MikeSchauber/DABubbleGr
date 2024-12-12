/**
 * Component for managing and editing members of a channel.
 */
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChannelService } from '../../../../core/services/channel.service';
import { MemberService } from '../../../../core/services/member.service';
import { User } from '../../../../models/interfaces/user.interface';
import { UserService } from '../../../../core/services/user.service';
import { BehaviorSubject, Observable, combineLatest, Subject, takeUntil } from 'rxjs';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { InfoFlyerService } from '../../../../core/services/info-flyer.service';

/**
 * Enhanced user model that extends the basic User interface.
 */
interface EnhancedUser extends User {
  conversationId: string; // Unique identifier for conversations
  messageCount: number; // Number of messages exchanged with the user
}

@Component({
  selector: 'app-edit-members-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-members-popup.component.html',
  styleUrls: ['./edit-members-popup.component.scss'],
})
export class EditMembersPopupComponent implements OnInit {
  /**
   * Channel ID for the current channel.
   */
  @Input() channelId!: string;

  /**
   * Name of the current channel.
   */
  @Input() channelName!: string;

  /**
   * List of current member IDs in the channel.
   */
  @Input() memberIds: string[] = [];

  /**
   * Event emitted when the popup is closed.
   */
  @Output() closePopup = new EventEmitter<void>();

  /**
   * Event emitted when the member list is updated.
   */
  @Output() membersUpdated = new EventEmitter<string[]>();

  private destroy$ = new Subject<void>();
  private publicUsersSubject = new BehaviorSubject<User[] | null>([]);

  /**
   * Observable for all public users.
   */
  public publicUsers$ = this.publicUsersSubject.asObservable();

  /**
   * Observable for all enhanced users with additional data.
   */
  users$: BehaviorSubject<EnhancedUser[]> = new BehaviorSubject<EnhancedUser[]>([]);

  /**
   * Observable for channel members.
   */
  channelMembers$: BehaviorSubject<EnhancedUser[]> = new BehaviorSubject<EnhancedUser[]>([]);

  /**
   * Observable for filtered users who are not members of the channel.
   */
  filteredUsers$: BehaviorSubject<EnhancedUser[]> = new BehaviorSubject<EnhancedUser[]>([]);

  /**
   * Set of selected user IDs for adding members.
   */
  selectedUserIds: Set<string> = new Set<string>();

  isEditMembersPopupOpen = true;
  isAddMemberPopupOpen = false;
  isDropdownOpen = false;
  newMemberName = '';

  constructor(
    private memberService: MemberService,
    private userService: UserService,
    private firestore: Firestore,
    private channelService: ChannelService,
    private infoService: InfoFlyerService
  ) {}

  /**
   * Lifecycle hook for initializing the component.
   */
  ngOnInit(): void {
    this.loadEnhancedUsers();
    this.loadChannelMembers();
    this.loadPublicUserData();

    combineLatest([this.users$, this.channelMembers$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([users, members]) => {
        const nonMembers = users.filter(
          (user) => !members.some((member) => member.publicUserId === user.publicUserId)
        );
        this.filteredUsers$.next(nonMembers);
      });
  }

  /**
   * Lifecycle hook for cleaning up subscriptions.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load enhanced user data with additional details.
   */
  private loadEnhancedUsers(): void {
    this.userService.enhancedUsers$.subscribe((enhancedUsers) => {
      this.users$.next(enhancedUsers || []);
    });
  }

  /**
   * Load members of the current channel.
   */
  private loadChannelMembers(): void {
    this.memberService.getMembersOfChannel(this.channelId).then((memberIds) => {
      const allUsers = this.users$.getValue();
      const members = allUsers.filter((user) => memberIds.includes(user.publicUserId));
      this.channelMembers$.next(members);

      const nonMembers = allUsers.filter(
        (user) => !members.some((member) => member.publicUserId === user.publicUserId)
      );
      this.filteredUsers$.next(nonMembers);
    });
  }

  /**
   * Load public user data from Firestore.
   */
  private loadPublicUserData(): void {
    const publicUserDataCollection = collection(this.firestore, 'publicUserData');
    const publicUserDataObservable = collectionData(publicUserDataCollection, {
      idField: 'publicUserId',
    }) as Observable<User[]>;

    publicUserDataObservable.subscribe({
      next: (publicUsers) => this.publicUsersSubject.next(publicUsers),
      error: () => this.publicUsersSubject.next([]),
    });
  }

  /**
   * Toggle the visibility of the dropdown.
   * @param isOpen Whether the dropdown should be open.
   */
  toggleDropdown(isOpen: boolean): void {
    this.isDropdownOpen = isOpen;
  }

  /**
   * Filter users based on the input value.
   * @param event Input event for filtering users.
   */
  filterUsers(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchText = input?.value.toLowerCase() || '';
    const filtered = this.users$
      .getValue()
      .filter(
        (user) =>
          user.displayName.toLowerCase().includes(searchText) &&
          !this.channelMembers$.getValue().some(
            (member) => member.publicUserId === user.publicUserId
          )
      );
    this.filteredUsers$.next(filtered);
  }

  /**
   * Toggle selection of a user for adding to the channel.
   * @param userId ID of the user to toggle.
   */
  toggleUserSelection(userId: string): void {
    if (this.selectedUserIds.has(userId)) {
      this.selectedUserIds.delete(userId);
    } else {
      this.selectedUserIds.add(userId);
    }
    this.newMemberName = '';
  }

  /**
   * Add the selected users to the channel.
   */
  addSelectedUsers(): void {
    const newMemberIds = Array.from(this.selectedUserIds);

    if (newMemberIds.length === 0) {
      alert('Bitte wählen Sie mindestens einen Benutzer aus.');
      return;
    }

    this.memberService.addMembersToChannel(this.channelId, newMemberIds).then(() => {
      this.selectedUserIds.clear();
      this.loadChannelMembers();
      this.isDropdownOpen = false;
      this.isAddMemberPopupOpen = false;
      this.infoService.createInfo('Mitglieder erfolgreich hinzugefügt.', true);
      this.membersUpdated.emit(newMemberIds);
      this.closePopup.emit();
    });
  }

  /**
   * Remove a member from the channel and update the list.
   * @param memberId ID of the member to remove.
   */
  removeMember(memberId: string): void {
    this.channelService.removeMemberFromChannel(this.channelId, memberId)
      .then(() => {
        const updatedMembers = this.channelMembers$.getValue().filter(
          (member) => member.publicUserId !== memberId
        );
        this.channelMembers$.next(updatedMembers);

        const nonMembers = this.users$.getValue().filter(
          (user) => !updatedMembers.some((member) => member.publicUserId === user.publicUserId)
        );
        this.filteredUsers$.next(nonMembers);

        this.infoService.createInfo('Mitglied erfolgreich entfernt.', true);
      })
      .catch(() => {
        this.infoService.createInfo('Fehler beim Entfernen des Mitglieds.', false);
      });
  }

  /**
   * Close the popup.
   */
  close(): void {
    this.closePopup.emit();
  }

  /**
   * Open the popup for adding members.
   */
  openAddMemberPopup(): void {
    this.isAddMemberPopupOpen = true;
    this.isEditMembersPopupOpen = false;
  }

  /**
   * Close the popup for adding members.
   */
  closeAddMemberPopup(): void {
    this.isAddMemberPopupOpen = false;
  }

  /**
   * Add a user by their name.
   */
  addUserByName(): void {
    const searchName = this.newMemberName.toLowerCase().trim();
    if (!searchName) {
      alert('Bitte geben Sie einen gültigen Namen ein.');
      return;
    }

    const matchingUser = this.filteredUsers$.getValue().find((user) =>
      user.displayName.toLowerCase().startsWith(searchName)
    );

    if (matchingUser) {
      if (!this.channelMembers$
        .getValue()
        .some((member) => member.publicUserId === matchingUser.publicUserId)) {
        this.selectedUserIds.add(matchingUser.publicUserId);
        this.newMemberName = matchingUser.displayName;
        this.filterUsers(new Event('input'));
      } else {
        alert('Dieser Benutzer ist bereits Mitglied des Kanals.');
      }
    } else {
      alert(`Kein Benutzer gefunden, der mit "${this.newMemberName}" beginnt.`);
    }
    this.isDropdownOpen = false;
  }
}
