import { EventEmitter, inject, Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  collectionData,
  arrayUnion,
  doc,
  setDoc,
  arrayRemove,
} from '@angular/fire/firestore';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  first,
  map,
  Observable,
  shareReplay,
  Subject,
  takeUntil,
} from 'rxjs';
import { Channel } from '../../models/channel.model.class';
import { AuthService } from './auth.service';
import { onAuthStateChanged } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class ChannelService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private firestore = inject(Firestore);

  public channelsSubject = new BehaviorSubject<Channel[]>([]); // BehaviorSubject für reaktive Kanäle
  // currentUserId: string = '';

  //Channel Liste als Observable für Komponenten
  channels$ = this.channelsSubject.asObservable();

  private currentChannelIdSubject = new BehaviorSubject<string | null>(null);
  currentChannelId$ = this.currentChannelIdSubject.asObservable();

  closeThreadBarEvent = new EventEmitter<void>();

  channelChanged = new EventEmitter<void>();

  currentChannel$ = combineLatest([
    this.channels$,
    this.currentChannelId$,
  ]).pipe(
    map(([channels, currentChannelId]) => {
      if (!channels.length || !currentChannelId) return null;
      //For new message chat header
      if (currentChannelId === 'newMessage') {
        return {
          channelId: 'newMessage',
        };
      }
      return channels.find((c) => c.channelId === currentChannelId) || null;
    }),
    filter((channel): channel is Channel => channel !== null),
    distinctUntilChanged((prev, curr) => {
      // Compare all relevant properties including memberIds, to update members, not only the whole channel object in realtime too
      return (
        prev.channelId === curr.channelId &&
        JSON.stringify(prev.memberIds) === JSON.stringify(curr.memberIds) &&
        prev.description === curr.description &&
        prev.name === curr.name
      );
    }),
    shareReplay(1)
  );

  constructor(public authService: AuthService) {
    onAuthStateChanged(this.authService.auth, (user) => {
      if (user) {
        this.destroy$ = new Subject<void>(); // Reset destroy$
        this.loadChannels();
        this.checkWelcomeTeamChannel();
      } else {
        // Clear channels and signal subscriptions to unsubscribe
        this.channelsSubject.next([]);
        this.destroy$.next();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(); // Emit a value to signal all subscriptions should close
    this.destroy$.complete(); // Complete the subject to clean up resources
  }

  //   ////Hier muss noch gefiltert werden, anhand wo currentUserId auch in den channelMember[] arrays der channels vorhanden ist !
  //   ////Hier muss noch gefiltert werden, anhand wo currentUserId auch in den channelMember[] arrays der channels vorhanden ist !
  //   ////Hier muss noch gefiltert werden, anhand wo currentUserId auch in den channelMember[] arrays der channels vorhanden ist !

  private loadChannels(): void {
    const channelsCollection = collection(this.firestore, 'channels');
    // const channelsObservable = collectionData(channelsCollection, { idField: 'channelId' }) as Observable<Channel[]>;

    const channelsObservable = collectionData(channelsCollection, {
      idField: 'channelId',
      snapshotListenOptions: { includeMetadataChanges: true },
    }) as Observable<Channel[]>;

    //Sort fetched channels for correct display order
    channelsObservable
      .pipe(
        map((channels) => {
          let sorted = [...channels].sort((a, b) => {
            const createdAtA = new Date(a.createdAt).getTime() || 0;
            const createdAtB = new Date(b.createdAt).getTime() || 0;
            return createdAtA - createdAtB;
          });

          sorted = sorted.sort((a, b) => {
            if (a.name === 'Welcome Team!') return -1;
            if (b.name === 'Welcome Team!') return 1;
            return 0;
          });

          return sorted;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (finalSortedChannels) => {
          this.channelsSubject.next(finalSortedChannels);
        },
        error: (error) => {
          if (error.code === 'permission-denied') {
            console.warn('Permission denied for fetching channels');
          } else {
            console.error('Error fetching channels:', error);
          }
        },
      });
  }

  /**
   * Check if "Welcome Team!" channel exists.
   * If yes, set current channel to it.
   * If not, update Firestore doc with current user ID to include currentUserId.
   */
  private checkWelcomeTeamChannel(): void {
    this.channels$
      .pipe(
        // Wait until we actually have channels loaded
        first((channels) => channels.length > 0),
        // Add error handling
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: async (channels) => {
          const welcomeTeamChannel = channels.find(
            (ch) => ch.name === 'Welcome Team!'
          );

          if (welcomeTeamChannel) {
            // console.log('Found Welcome Team channel:', welcomeTeamChannel);
            // Check if user is already a member
            if (
              !welcomeTeamChannel.memberIds?.includes(
                this.authService.currentUserData.publicUserId
              )
            ) {
              await this.addUserToWelcomeTeamChannelInFirestore();
            } else {
              this.setCurrentChannel(welcomeTeamChannel.channelId);
            }
          } else {
            console.log('Welcome Team channel not found');
            await this.addUserToWelcomeTeamChannelInFirestore();
          }
        },
        error: (error) => {
          console.error('Error checking Welcome Team channel:', error);
        },
      });
  }

  /**
   * Adds the current user to the members array of the Firestore document
   * with the key "Sce57acZnV7DDXMRasdf".
   */
  private async addUserToWelcomeTeamChannelInFirestore(): Promise<void> {
    if (!this.authService.currentUserData.publicUserId) return;

    const channelId = 'Sce57acZnV7DDXMRasdf';
    const channelRef = doc(this.firestore, 'channels', channelId);

    try {
      await updateDoc(channelRef, {
        memberIds: arrayUnion(this.authService.currentUserData.publicUserId),
      });
      console.log(
        `Current user ${this.authService.currentUserData.publicUserId} added to Welcome Team channel in Firestore.`
      );
      this.setCurrentChannel(channelId);
    } catch (error) {
      console.error('Error updating Welcome Team channel:', error);
    }
  }

  async createChannel(name: string, description: string): Promise<string> {
    try {
      const now = new Date();
      const createdBy = this.authService.currentUserData.publicUserId; // Replace with actual user ID if available
      const newChannelData = {
        name,
        description,
        createdBy,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        memberIds: [], // Initialize empty member IDs array
      };

      // Create the document in Firestore
      const channelsCollection = collection(this.firestore, 'channels');
      const docRef = await addDoc(channelsCollection, newChannelData);

      // Update the document with the generated Firestore ID
      await updateDoc(docRef, {
        channelId: docRef.id,
      });

      // Create a local Channel object
      const newChannel = new Channel(
        docRef.id,
        name,
        createdBy,
        now,
        now,
        description,
        []
      );

      // Sort channels by `createdAt` after adding the new one
      const updatedChannels = [...this.channelsSubject.value, newChannel].sort(
        (a, b) => {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
      );

      // Update the local channel list
      this.channelsSubject.next(updatedChannels);

      // console.log(`Channel created with ID: ${docRef.id}`);

      // Set the new channel as the current active channel
      this.setCurrentChannel(docRef.id);

      return docRef.id;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  }

  /**
   * Fügt Mitglieder zu einem Kanal hinzu
   * @param channelId Die ID des Kanals
   * @param memberIds Eine Liste von Mitglieds-IDs
   */
  async addMembersToChannel(
    channelId: string,
    memberIds: string[]
  ): Promise<void> {
    console.log('Adding members to channel:', { channelId, memberIds }); // Debug log
    try {
      if (!channelId || memberIds.length === 0) {
        console.error('Invalid channelId or memberIds:', {
          channelId,
          memberIds,
        }); // Debug log
        throw new Error('Ungültige Eingaben für Mitglieder oder Kanal-ID.');
      }

      const channelRef = doc(this.firestore, 'channels', channelId);

      await updateDoc(channelRef, {
        memberIds: arrayUnion(...memberIds),
      });

      console.log(
        `Members successfully added to channel ${channelId}:`,
        memberIds
      );
    } catch (error) {
      console.error('Error while adding members:', error);
      throw error;
    }
  }

  async updateChannel(
    channelId: string,
    name: string,
    description: string
  ): Promise<void> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);
      await updateDoc(channelRef, {
        name,
        description,
        updatedAt: new Date(),
      });

      console.log(`Channel ${channelId} updated successfully.`);

      // Lokale Daten aktualisieren
      const updatedChannels = this.channelsSubject.value.map((channel) =>
        channel.channelId === channelId
          ? { ...channel, name, description }
          : channel
      );

      this.channelsSubject.next(updatedChannels);
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  }

  async removeMemberFromChannel(channelId: string, memberId: string) {
    const channelRef = doc(this.firestore, 'channels', channelId);
    await updateDoc(channelRef, {
      memberIds: arrayRemove(memberId),
    });
  }

  /**
   * Sets the current channel to display
   * @param channelId - ID of the channel to display
   */
  displayChannel(channelId: string): void {
    this.setCurrentChannel(channelId);
  }

  /**
   * Sets the current channel ID
   * @param channelId - ID of the channel
   */
  setCurrentChannel(channelId: string): void {
    this.currentChannelIdSubject.next(channelId);
    console.log(channelId);

    this.closeThreadBarEvent.emit();
    ///Event emitter here for dashboard component to close the thread bar.

    ///Event for autofocus inside chat component textarea
    this.channelChanged.emit();

    // console.log(`Channel service: Changed current channel to ${channelId}`);
  }

  //When clicking on a other user in the sidenav and no messages exist between two users, create new direct message channel
  async createPrivateChannel(
    conversationId: string,
    otherUserId: string
  ): Promise<string> {
    console.log('conversationId:', conversationId);

    try {
      const now = new Date();
      const createdBy = this.authService.currentUserData.publicUserId;
      const channelName = `DM_${conversationId}`;

      // Use conversationId as both the doc ID and channelId
      const newChannelData = {
        type: 'private',
        channelId: conversationId,
        createdBy: createdBy,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        memberIds: [this.authService.currentUserData.publicUserId, otherUserId],
        name: channelName,
        lastReadInfo: {
          [this.authService.currentUserData.publicUserId]: {
            lastReadTimestamp: now.toISOString(),
            messageCount: 0,
          },
          [otherUserId]: {
            lastReadTimestamp: now.toISOString(),
            messageCount: 0,
          },
        },
      };

      const channelsCollection = collection(this.firestore, 'channels');
      const channelDocRef = doc(channelsCollection, conversationId);

      // Use setDoc to create the document with conversationId as the key
      await setDoc(channelDocRef, newChannelData);

      const newChannel = Channel.fromFirestoreData(
        newChannelData,
        conversationId
      );

      // Append the new channel to the existing list
      const updatedChannels = [...this.channelsSubject.value, newChannel];
      this.channelsSubject.next(updatedChannels);

      return conversationId;
    } catch (error) {
      console.error('Error creating private channel:', error);
      throw error;
    }
  }
}
