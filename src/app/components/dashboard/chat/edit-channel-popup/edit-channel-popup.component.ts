import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Firestore, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import { UserService } from '../../../../core/services/user.service';
import { MemberService } from '../../../../core/services/member.service';
import { ChannelService } from '../../../../core/services/channel.service';
import { InfoFlyerService } from '../../../../core/services/info-flyer.service';
import { UserClass } from '../../../../models/user-class.class';
import { Channel } from '../../../../models/channel.model.class';

/**
 * Component for managing the Edit Channel popup.
 * Handles operations like updating channel details, adding/removing members, etc.
 */
@Component({
  selector: 'app-edit-channel-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-channel-popup.component.html',
  styleUrls: ['./edit-channel-popup.component.scss'],
})
export class EditChannelPopupComponent implements OnInit, OnDestroy {
  /** ====== Input Properties ====== **/
  @Input() channelName = '';
  @Input() description = '';
  @Input() createdBy = '';
  @Input() channelId = '';
  @Input() memberIds: string[] = [];

  /** ====== Output Events ====== **/
  @Output() channelChanges = new EventEmitter<{ name: string; description: string }>();
  @Output() closePopup = new EventEmitter<void>();
  @Output() membersUpdated = new EventEmitter<string[]>();

  /** ====== State Variables ====== **/
  isEditChannelMode = false;
  isEditDescriptionMode = false;
  isAddMemberPopupOpen = false;
  isEditMembersPopupOpen = true;
  isDropdownOpen = false;
  newMemberName = '';
  isMobileView = false;

  /** ====== Observables and Subjects ====== **/
  users$ = new BehaviorSubject<UserClass[]>([]);
  channelMembers$ = new BehaviorSubject<UserClass[]>([]);
  filteredUsers$ = new BehaviorSubject<UserClass[]>([]);
  selectedUserIds = new Set<string>();
  getChannelWithCreator$: Observable<{ channel: Channel; creatorName: string }> | null = null;

  private destroy$ = new Subject<void>();

  /** ====== Constructor ====== **/
  constructor(
    private firestore: Firestore,
    private userService: UserService,
    private memberService: MemberService,
    private infoService: InfoFlyerService,
    private channelService: ChannelService
  ) {}

  /** ====== Lifecycle Hooks ====== **/
  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.cleanupSubscriptions();
  }

  /** ====== Host Listeners ====== **/
  @HostListener('window:resize')
  onResize(): void {
    this.checkViewport();
  }

  /** ====== Methods ====== **/

  /**
   * Initializes component by loading data and setting up reactive streams.
   */
  private initializeComponent(): void {
    this.checkViewport();
    this.loadPublicUserData();
    this.loadChannelMembers();

    combineLatest([this.users$, this.channelMembers$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([users, members]) => {
        const nonMembers = users.filter(
          (user) => !members.some((member) => member.publicUserId === user.publicUserId)
        );
        this.filteredUsers$.next(nonMembers);
      });

    if (this.channelId) {
      const channel$ = this.getChannelObservable(this.channelId);
      const users$ = this.getUsersObservable();

      this.getChannelWithCreator$ = combineLatest([channel$, users$]).pipe(
        map(([channel, users]) => {
          const creator = users.find((user) => user.publicUserId === channel.createdBy);
          return { channel, creatorName: creator?.displayName || 'Unknown User' };
        })
      );
    }
  }

  /**
   * Cleans up active subscriptions on component destruction.
   */
  private cleanupSubscriptions(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Checks the current viewport width and sets the mobile view flag.
   */
  private checkViewport(): void {
    this.isMobileView = window.innerWidth <= 768;
  }

  /** ====== Firestore Queries ====== **/

  /**
   * Fetches all users from Firestore and maps them to UserClass.
   * @returns Observable<UserClass[]>
   */
  getUsersObservable(): Observable<UserClass[]> {
    const usersCollection = collection(this.firestore, 'publicUserData');
    return collectionData(usersCollection, { idField: 'publicUserId' }).pipe(
      map((users: any[]) =>
        users.map(user =>
          new UserClass(
            user.accountEmail,
            user.displayEmail,
            user.displayName,
            user.userStatus,
            user.avatarUrl,
            new Date(user.createdAt),
            new Date(user.updatedAt),
            user.publicUserId
          )
        )
      )
    );
  }

  /**
   * Fetches channel data for the given channel ID.
   * @param channelId ID of the channel to fetch.
   * @returns Observable<Channel>
   */
  getChannelObservable(channelId: string): Observable<Channel> {
    const channelDoc = doc(this.firestore, `channels/${channelId}`);
    return docData(channelDoc, { idField: 'channelId' }).pipe(
      map((data) => Channel.fromFirestoreData(data, channelId))
    );
  }

  /**
   * Loads all public user data into a BehaviorSubject.
   */
  private loadPublicUserData(): void {
    const publicUserDataCollection = collection(this.firestore, 'publicUserData');
    const publicUserDataObservable = collectionData(publicUserDataCollection, {
      idField: 'publicUserId',
    }) as Observable<UserClass[]>;

    publicUserDataObservable.subscribe({
      next: (users) => this.users$.next(users),
      error: () => this.users$.next([]),
    });
  } 
 
// Section: Mode Toggling

/**
 * Toggles the edit channel name mode.
 */
toggleEditChannelMode(): void {
  this.isEditChannelMode = !this.isEditChannelMode;
  this.isEditDescriptionMode = false;
}

/**
 * Toggles the edit channel description mode.
 */
toggleEditDescriptionMode(): void {
  this.isEditDescriptionMode = !this.isEditDescriptionMode;
  this.isEditChannelMode = false;
}

// Section: Saving Changes

/**
 * Saves changes to the channel name and description.
 * Emits an event with updated channel details.
 */
saveChannelChanges(): void {
  if (!this.channelName.trim()) return;
  this.channelChanges.emit({ name: this.channelName, description: this.description });
  this.isEditChannelMode = false;
}

/**
 * Saves changes to the channel description.
 * Emits an event with updated channel details.
 */
saveDescriptionChanges(): void {
  this.channelChanges.emit({ name: this.channelName, description: this.description });
  this.isEditDescriptionMode = false;
}

/**
 * Closes the edit popup.
 * Emits a closePopup event.
 */
onClose(): void {
  this.closePopup.emit();
}

// Section: Member Management

/**
 * Opens the "Add Members" popup and filters non-members.
 */
openAddMemberPopup(): void {
  this.isAddMemberPopupOpen = true;
  this.isEditMembersPopupOpen = false;

  combineLatest([this.users$.asObservable(), this.channelMembers$.asObservable()])
    .pipe(
      map(([allUsers, channelMembers]) =>
        allUsers.filter(
          (user) => !channelMembers.some((member) => member.publicUserId === user.publicUserId)
        )
      )
    )
    .subscribe((nonMembers) => {
      this.filteredUsers$.next(nonMembers);
    });
}

/**
 * Toggles the selection of a user for adding to the channel.
 * @param userId The ID of the user to toggle.
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
 * Adds selected users to the channel.
 * Emits an event with the updated member list.
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
    this.infoService.createInfo('Mitglieder erfolgreich hinzugefügt.', false);
    this.membersUpdated.emit(newMemberIds);
    this.closePopup.emit();
  });
}

/**
 * Removes a member from the channel.
 * Updates the list of members and non-members.
 * @param memberId The ID of the member to remove.
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

      this.infoService.createInfo('Mitglied erfolgreich entfernt.', false);
    })
    .catch(() => {
      this.infoService.createInfo('Fehler beim Entfernen des Mitglieds.', true);
    });
}

/**
 * Closes the "Add Members" popup.
 */
closeAddMemberPopup(): void {
  this.isAddMemberPopupOpen = false;
}

/**
 * Adds a user by their name.
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

// Section: Dropdown Management

/**
 * Toggles the visibility of the dropdown.
 * @param isOpen Whether the dropdown should be open.
 */
toggleDropdown(isOpen: boolean): void {
  this.isDropdownOpen = isOpen;
}

// Section: Search and Filtering

/**
 * Filters users based on the input value.
 * @param event Input event containing the search term.
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

// Section: Load Channel Members

/**
 * Loads members of the current channel.
 * Updates the channelMembers$ and filteredUsers$ observables.
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
}

