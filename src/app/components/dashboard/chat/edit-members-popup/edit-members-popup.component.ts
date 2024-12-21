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
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  Subject,
  takeUntil,
} from 'rxjs';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { InfoFlyerService } from '../../../../core/services/info-flyer.service';
import { Channel } from '../../../../models/channel.model.class';

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
  /** ====== Input Properties ====== **/
  @Input() channelId!: string;
  @Input() channelName!: string;
  @Input() memberIds: string[] = [];

  /** ====== Output Events ====== **/
  @Output() closePopup = new EventEmitter<void>();
  @Output() membersUpdated = new EventEmitter<string[]>();

  /** ====== Observables and Subjects ====== **/
  private publicUsersSubject = new BehaviorSubject<User[] | null>([]);
  public publicUsers$ = this.publicUsersSubject.asObservable();
  private destroy$ = new Subject<void>();
  users$: BehaviorSubject<EnhancedUser[]> = new BehaviorSubject<EnhancedUser[]>(
    []
  );
  channelMembers$: BehaviorSubject<EnhancedUser[]> = new BehaviorSubject<
    EnhancedUser[]
  >([]);
  filteredUsers$: BehaviorSubject<EnhancedUser[]> = new BehaviorSubject<
    EnhancedUser[]
  >([]);
  hoveredUserIndex: number = -1;

  /** ====== State Variables ====== **/
  selectedUserIds: Set<string> = new Set<string>();
  isEditMembersPopupOpen = true;
  isAddMemberPopupOpen = false;
  isDropdownOpen = false;
  newMemberName = '';

  /** @public Observable stream of the current channel */
  currentChannel$: Observable<Channel | null>;

  constructor(
    private memberService: MemberService,
    private userService: UserService,
    private firestore: Firestore,
    private channelService: ChannelService,
    private infoService: InfoFlyerService
  ) {
    this.currentChannel$ = this.channelService.currentChannel$;
  }

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
          (user) =>
            !members.some((member) => member.publicUserId === user.publicUserId)
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
      const members = allUsers.filter((user) =>
        memberIds.includes(user.publicUserId)
      );
      this.channelMembers$.next(members);

      const nonMembers = allUsers.filter(
        (user) =>
          !members.some((member) => member.publicUserId === user.publicUserId)
      );
      this.filteredUsers$.next(nonMembers);
    });
  }

  /**
   * Load public user data from Firestore.
   */
  private loadPublicUserData(): void {
    const publicUserDataCollection = collection(
      this.firestore,
      'publicUserData'
    );
    const publicUserDataObservable = collectionData(publicUserDataCollection, {
      idField: 'publicUserId',
    }) as Observable<User[]>;

    publicUserDataObservable.subscribe({
      next: (publicUsers) => this.publicUsersSubject.next(publicUsers),
      error: () => this.publicUsersSubject.next([]),
    });
  }

  toggleDropdown(isOpen: boolean): void {
    this.isDropdownOpen = isOpen;
  }

  /**
   * Filter users based on the input value.
   * @param event Input event for filtering users.
   */
  filterUsers(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchText = input.value.toLowerCase();

    // Filter users while maintaining the entire list
    const allUsers = this.users$.getValue();
    const nonMembers = allUsers.filter(
      (user) =>
        !this.channelMembers$
          .getValue()
          .some((member) => member.publicUserId === user.publicUserId)
    );

    const filtered = searchText
      ? nonMembers.filter((user) =>
          user.displayName.toLowerCase().includes(searchText)
        )
      : nonMembers;

    this.filteredUsers$.next(filtered);
  }

  isUserHighlighted(user: EnhancedUser): boolean {
    const currentHoveredUser =
      this.filteredUsers$.getValue()[this.hoveredUserIndex];
    return currentHoveredUser?.publicUserId === user.publicUserId;
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

    // Sicherstellen, dass die gesamte Liste wieder angezeigt wird
    const allUsers = this.users$.getValue();
    const nonMembers = allUsers.filter(
      (user) =>
        !this.channelMembers$
          .getValue()
          .some((member) => member.publicUserId === user.publicUserId)
    );

    this.filteredUsers$.next(nonMembers);
    this.newMemberName = '';
  }

  addSelectedUsers(): void {
    const newMemberIds = Array.from(this.selectedUserIds);

    if (newMemberIds.length === 0) {
      alert('Bitte wählen Sie mindestens einen Benutzer aus.');
      return;
    }

    this.memberService
      .addMembersToChannel(this.channelId, newMemberIds)
      .then(() => {
        this.selectedUserIds.clear();
        this.loadChannelMembers();
        this.isDropdownOpen = false;
        this.isAddMemberPopupOpen = false;
        this.infoService.createInfo(
          'Mitglieder erfolgreich hinzugefügt.',
          false
        );
        this.membersUpdated.emit(newMemberIds);
        this.closePopup.emit();
      });
  }

  /**
   * Remove a member from the channel and update the list.
   * @param memberId ID of the member to remove.
   */
  removeMember(memberId: string): void {
    this.channelService
      .removeMemberFromChannel(this.channelId, memberId)
      .then(() => {
        const updatedMembers = this.channelMembers$
          .getValue()
          .filter((member) => member.publicUserId !== memberId);
        this.channelMembers$.next(updatedMembers);

        const nonMembers = this.users$
          .getValue()
          .filter(
            (user) =>
              !updatedMembers.some(
                (member) => member.publicUserId === user.publicUserId
              )
          );
        this.filteredUsers$.next(nonMembers);

        this.infoService.createInfo('Mitglied erfolgreich entfernt.', false);

        this.channelService.refreshCurrentChannel();
      })
      .catch(() => {
        this.infoService.createInfo(
          'Fehler beim Entfernen des Mitglieds.',
          true
        );
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
    const inputName = this.newMemberName.toLowerCase().trim();
    if (!inputName) return;

    const matchingUser = this.filteredUsers$
      .getValue()
      .find((user) => user.displayName.toLowerCase().startsWith(inputName));

    if (matchingUser) {
      this.selectedUserIds.add(matchingUser.publicUserId);
      this.newMemberName = '';
    } else {
      alert('Kein Benutzer gefunden.');
    }
  }
}
