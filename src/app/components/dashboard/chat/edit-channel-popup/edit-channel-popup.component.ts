import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { combineLatest, map, Observable } from 'rxjs';
import { Firestore,  docData, doc, collectionData, collection } from '@angular/fire/firestore'; 
import { UserClass } from '../../../../models/user-class.class'; 
import { Channel } from '../../../../models/channel.model.class';

@Component({
  selector: 'app-edit-channel-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-channel-popup.component.html',
  styleUrls: ['./edit-channel-popup.component.scss'],
})
export class EditChannelPopupComponent {
  /** Indicates whether the component is in mobile view */
  @Input() isMobileView: boolean = false;

  /** Channel data inputs */
  @Input() channelName: string = '';
  @Input() description: string = '';
  @Input() createdBy: string = '';
  @Input() channelId: string = '';

  /** Output events */
  @Output() channelChanges = new EventEmitter<{ name: string; description: string }>();
  @Output() closePopup = new EventEmitter<void>();

  /** Edit mode states */
  isEditChannelMode: boolean = false;
  isEditDescriptionMode: boolean = false;

 /**
   * Observable for channel data combined with creator's user data
   * @type {Observable<{ channel: any; creatorName: string }>}
   */
 getChannelWithCreator$: Observable<{ channel: any; creatorName: string }> | null = null;

 constructor(private firestore: Firestore) {}

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
   if (this.channelId) {
     const channel$ = this.getChannelObservable(this.channelId);
     const users$ = this.getUsersObservable();

     this.getChannelWithCreator$ = combineLatest([channel$, users$]).pipe(
       map(([channel, users]) => {
         console.log('Channel:', channel); // Debugging: Kanal-Daten prüfen
         console.log('Users:', users); // Debugging: Benutzer-Daten prüfen

         // Suche den Benutzer, dessen publicUserId mit createdBy übereinstimmt
         const creator = users.find(user => user.publicUserId === channel.createdBy);
         console.log('Creator:', creator); // Debugging: Gefundener Ersteller

         return {
           channel,
           creatorName: creator?.displayName || 'Unbekannter Nutzer',
         };
       })
     );
   }
 }

  /**
   * Toggles edit mode for the channel name.
   */
  toggleEditChannelMode(): void {
    this.isEditChannelMode = !this.isEditChannelMode;
    if (this.isEditChannelMode) {
      this.isEditDescriptionMode = false; // Ensure only one mode is active
    }
  }

  /**
   * Toggles edit mode for the description.
   */
  toggleEditDescriptionMode(): void {
    this.isEditDescriptionMode = !this.isEditDescriptionMode;
    if (this.isEditDescriptionMode) {
      this.isEditChannelMode = false; // Ensure only one mode is active
    }
  }

  /**
   * Saves changes for the channel name.
   */
  saveChannelChanges(): void {
    if (!this.channelName.trim()) {
      console.error('Channel name cannot be empty.');
      return;
    }

    this.channelChanges.emit({
      name: this.channelName,
      description: this.description,
    });
    console.log('Channel name saved:', this.channelName);

    this.isEditChannelMode = false;
  }

  /**
   * Saves changes for the description.
   */
  saveDescriptionChanges(): void {
    this.channelChanges.emit({
      name: this.channelName,
      description: this.description,
    });
    console.log('Channel description saved:', this.description);

    this.isEditDescriptionMode = false;
  }

  /**
   * Handles closing the popup and resetting states.
   */
  onClose(): void {
    this.resetState();
    this.closePopup.emit();
  }

  /**
   * Resets the form state.
   */
  private resetState(): void {
    this.isEditChannelMode = false;
    this.isEditDescriptionMode = false;
  }
}
