import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { combineLatest, map, Observable, BehaviorSubject } from 'rxjs';
import { Firestore,  docData, doc, collectionData, collection } from '@angular/fire/firestore';
import { UserService } from '../../../../core/services/user.service';
import { UserClass } from '../../../../models/user-class.class'; 
import { Channel } from '../../../../models/channel.model.class';  
import { Subject } from 'rxjs';
import { MemberService } from '../../../../core/services/member.service';
import { ChannelService } from '../../../../core/services/channel.service';
import { InfoFlyerService } from '../../../../core/services/info-flyer.service';
import { takeUntil as rxjsTakeUntil } from 'rxjs';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-edit-channel-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-channel-popup.component.html',
  styleUrls: ['./edit-channel-popup.component.scss'],
})

export class EditChannelPopupComponent implements OnInit {
 /** Input Properties */ 
 @Input() channelName = '';
 @Input() description = '';
 @Input() createdBy = '';
 @Input() channelId = '';
 @Input() memberIds: string[] = [];

 /** Output Events */
 @Output() channelChanges = new EventEmitter<{ name: string; description: string }>();
 @Output() closePopup = new EventEmitter<void>();
 @Output() membersUpdated = new EventEmitter<string[]>();

 /** State Management */
 isEditChannelMode: boolean = false;
 isEditDescriptionMode: boolean = false;
 isAddMemberPopupOpen = false;
 isEditMembersPopupOpen = true;
 isDropdownOpen = false;
 newMemberName = '';
 isMobileView = false;

 /** BehaviorSubjects */
 users$ = new BehaviorSubject<UserClass[]>([]); 
 channelMembers$ = new BehaviorSubject<UserClass[]>([]);
 filteredUsers$ = new BehaviorSubject<UserClass[]>([]);
 selectedUserIds: Set<string> = new Set<string>();

  /**
   * Observable for channel data combined with creator's user data
   * @type {Observable<{ channel: any; creatorName: string }>}
   */
  getChannelWithCreator$: Observable<{ channel: any; creatorName: string }> | null = null;


private destroy$ = new Subject<void>();

/** Lifecycle Management */
// private destroy$ = new Subject<void>();

constructor(private firestore: Firestore, private userService: UserService, private memberService: MemberService, private infoService: InfoFlyerService, private channelService: ChannelService) {}
  
/**
  * Fetches all users as an Observable.
  * Maps Firestore data to the `UserClass` structure.
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
 * Fetches channel data for a given channel ID.
 */
getChannelObservable(channelId: string): Observable<Channel> {
  const channelDoc = doc(this.firestore, `channels/${channelId}`);
  return docData(channelDoc, { idField: 'channelId' }).pipe(
    map(data => Channel.fromFirestoreData(data, channelId))
  );
}

/**
 * Combines channel data with the creator's user data.
 * Sets `getChannelWithCreator$` to provide channel and creator info.
 */
ngOnInit(): void {
  this.checkViewport();
  this.loadPublicUserData(); // Lädt die Liste aller Benutzer
  this.loadChannelMembers(); // Lädt Mitglieder des Kanals

  // Abonniert Benutzer- und Mitgliedsdaten und filtert Nicht-Mitglieder
  combineLatest([this.users$, this.channelMembers$])
    .pipe(takeUntil(this.destroy$))
    .subscribe(([users, members]) => {
      const nonMembers = users.filter(
        (user) => !members.some((member) => member.publicUserId === user.publicUserId)
      );
      this.filteredUsers$.next(nonMembers);
    });

  // Kombination der Kanaldaten mit dem Ersteller
  if (this.channelId) {
    const channel$ = this.getChannelObservable(this.channelId);
    const users$ = this.getUsersObservable();

    this.getChannelWithCreator$ = combineLatest([channel$, users$]).pipe(
      map(([channel, users]) => {
        console.log('Channel:', channel); // Debugging: Kanal-Daten prüfen
        console.log('Users:', users); // Debugging: Benutzer-Daten prüfen

        // Suche den Benutzer, dessen publicUserId mit createdBy übereinstimmt
        const creator = users.find((user) => user.publicUserId === channel.createdBy);
        console.log('Creator:', creator); // Debugging: Gefundener Ersteller

        return {
          channel,
          creatorName: creator?.displayName || 'Unbekannter Nutzer',
        };
      })
    );
  }
}

@HostListener('window:resize', ['$event'])
onResize(event: Event) {
  console.log('Resize event triggered');
  this.checkViewport();
}

checkViewport() {
  this.isMobileView = window.innerWidth <= 768;
  this.isMobileView = true; 
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

/**
 * Lädt alle Benutzer aus der Firestore-Datenbank.
 */
private loadPublicUserData(): void {
  const publicUserDataCollection = collection(this.firestore, 'publicUserData');
  const publicUserDataObservable = collectionData(publicUserDataCollection, {
    idField: 'publicUserId',
  }) as Observable<UserClass[]>;

  publicUserDataObservable.subscribe({
    next: (publicUsers) => this.users$.next(publicUsers),
    error: () => this.users$.next([]),
  });
}
 

toggleEditChannelMode(): void {
  this.isEditChannelMode = !this.isEditChannelMode;
  this.isEditDescriptionMode = false;
}

toggleEditDescriptionMode(): void {
  this.isEditDescriptionMode = !this.isEditDescriptionMode;
  this.isEditChannelMode = false;
}

saveChannelChanges(): void {
  if (!this.channelName.trim()) return;
  this.channelChanges.emit({ name: this.channelName, description: this.description });
  this.isEditChannelMode = false;
}

saveDescriptionChanges(): void {
  this.channelChanges.emit({ name: this.channelName, description: this.description });
  this.isEditDescriptionMode = false;
}

onClose(): void {
  this.closePopup.emit();
}

openAddMemberPopup(): void {
  this.isAddMemberPopupOpen = true;
  this.isEditMembersPopupOpen = false;

  // Load non-members for the "Add Members" popup
  combineLatest([this.users$.asObservable(), this.channelMembers$.asObservable()])
    .pipe(map(([allUsers, channelMembers]) => {
      return allUsers.filter(
        (user) => !channelMembers.some((member) => member.publicUserId === user.publicUserId)
      );
    }))
    .subscribe((nonMembers) => {
      this.filteredUsers$.next(nonMembers);
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
    this.infoService.createInfo('Mitglieder erfolgreich hinzugefügt.', false);
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

      this.infoService.createInfo('Mitglied erfolgreich entfernt.', false);
    })
    .catch(() => {
      this.infoService.createInfo('Fehler beim Entfernen des Mitglieds.', true);
    });
}

/**
 * Close the popup.
 */
close(): void {
  this.closePopup.emit();
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
}
function takeUntil<T>(destroy$: Subject<void>): import("rxjs").OperatorFunction<T, T> {
  return rxjsTakeUntil(destroy$);
}

