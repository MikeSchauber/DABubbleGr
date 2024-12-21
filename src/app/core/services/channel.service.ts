/**
 * @fileoverview Service for managing channel data in the application.
 * Handles channel creation, updates, member management, and real-time synchronization with Firestore.
 *
 * @requires @angular/core
 * @requires @angular/fire/firestore
 * @requires rxjs
 */

import { EventEmitter, inject, Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  collectionData,
  arrayUnion,
  doc,
  setDoc,
  arrayRemove,
  getDoc,
  query,
  where,
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
  /** @private Subject for handling component cleanup */
  private destroy$ = new Subject<void>();
  private firestore = inject(Firestore);

  /** @public BehaviorSubject maintaining the current state of channels */
  public channelsSubject = new BehaviorSubject<Channel[]>([]); // BehaviorSubject für reaktive Kanäle

  /** @public Observable stream of channels */
  channels$ = this.channelsSubject.asObservable();

  /** @private BehaviorSubject maintaining the current active channel ID */
  private currentChannelIdSubject = new BehaviorSubject<string | null>(null);

  /** @public Observable stream of the current channel ID */
  currentChannelId$ = this.currentChannelIdSubject.asObservable();

  closeThreadBarEvent = new EventEmitter<void>();

  /** @public Event emitter for autofocus inside chat component textarea on channel change */
  channelChanged = new EventEmitter<void>();

  /**
   * @public Observable combining channels and current channel ID
   * Emits the currently selected channel with real-time updates for member, channel name or description changes
   */
  currentChannel$ = combineLatest([
    this.channels$,
    this.currentChannelId$,
  ]).pipe(
    map(([channels, currentChannelId]) => {
      if (!channels.length || !currentChannelId) return null;
      if (currentChannelId === 'newMessage') {
        return { channelId: 'newMessage' };
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
        this.destroy$ = new Subject<void>(); // Reset destroy$ whenever logging in

        // Wait for currentUserId before proceeding
        this.authService.getCurrentUserId().then((userId) => {
          if (userId) {
            this.loadChannels(userId);
            this.checkWelcomeTeamChannel();
          }
        });
      } else {
        this.channelsSubject.next([]);
        this.destroy$.next();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads and maintains real-time channel data from Firestore.
   * Includes error handling for permission issues and maintains a sorted list of channels.
   * @private
   */
  private loadChannels(currentUserId: string): void {
    const channelsCollection = collection(this.firestore, 'channels');

    // Create a query to filter channels where currentUserId is in memberIds
    const channelsQuery = query(
      channelsCollection,
      where('memberIds', 'array-contains', currentUserId)
    );

    const channelsObservable = collectionData(channelsQuery, {
      idField: 'channelId',
      snapshotListenOptions: { includeMetadataChanges: true },
    }) as Observable<Channel[]>;

    channelsObservable
      .pipe(
        map((channels) => this.sortChannels(channels)),
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
   * Sorts channels by creation date and ensures the Welcome Team channel appears first.
   * @param {Channel[]} channels Array of channels to sort
   * @returns {Channel[]} Sorted array of channels
   * @private
   */
  private sortChannels(channels: Channel[]): Channel[] {
    // First sort by creation date
    let sorted = [...channels].sort((a, b) => {
      const createdAtA = new Date(a.createdAt).getTime() || 0;
      const createdAtB = new Date(b.createdAt).getTime() || 0;
      return createdAtA - createdAtB;
    });

    // Then ensure Welcome Team is first
    sorted = sorted.sort((a, b) => {
      if (a.name === 'Welcome Team!') return -1;
      if (b.name === 'Welcome Team!') return 1;
      return 0;
    });

    return sorted;
  }

  /**
   * Verifies the existence of the "Welcome Team!" channel and manages user membership.
   * If the channel exists, ensures current user is a member.
   * If not, adds the user to the channel.
   * @private
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
            await this.addUserToWelcomeTeamChannelInFirestore();
          }
        },
        error: (error) => {
          console.error('Error checking Welcome Team channel:', error);
        },
      });
  }

  /**
   * Adds the current user to the Welcome Team channel in Firestore.
   * Updates the channel's memberIds array and sets it as the current channel.
   * @returns {Promise<void>}
   * @private
   */
  private async addUserToWelcomeTeamChannelInFirestore(): Promise<void> {
    if (!this.authService.currentUserData.publicUserId) return;

    const channelId = 'Sce57acZnV7DDXMRasdf';
    const channelRef = doc(this.firestore, 'channels', channelId);

    try {
      await updateDoc(channelRef, {
        memberIds: arrayUnion(this.authService.currentUserData.publicUserId),
      });
      this.setCurrentChannel(channelId);
    } catch (error) {
      console.error('Error updating Welcome Team channel:', error);
    }
  }

  /**
   * Creates a new channel with the specified name and description.
   * The channel is created in Firestore and added to the local channel list.
   * @param {string} name The name of the new channel
   * @param {string} description The description of the new channel
   * @returns {Promise<string>} The ID of the newly created channel
   */
  async createChannel(name: string, description: string): Promise<string> {
    try {
      const now = new Date();
      const createdBy = this.authService.currentUserData.publicUserId;
      const newChannelData = {
        name,
        description,
        createdBy,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        memberIds: [],
      };

      const channelsCollection = collection(this.firestore, 'channels');
      const docRef = await addDoc(channelsCollection, newChannelData);

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

      // Set the new channel as the current active channel
      this.setCurrentChannel(docRef.id);

      return docRef.id;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  }

  /**
   * Adds multiple members to a specified channel.
   * Updates the memberIds array in Firestore with the new members.
   * @param {string} channelId The ID of the target channel
   * @param {string[]} memberIds Array of member IDs to add
   * @returns {Promise<void>}
   * @throws {Error} If channelId is invalid or memberIds array is empty
   */
  async addMembersToChannel(
    channelId: string,
    memberIds: string[]
  ): Promise<void> {
    try {
      if (!channelId || memberIds.length === 0) {
        console.error('Invalid channelId or memberIds:', {
          channelId,
          memberIds,
        });
        throw new Error('Ungültige Eingaben für Mitglieder oder Kanal-ID.');
      }

      const channelRef = doc(this.firestore, 'channels', channelId);

      await updateDoc(channelRef, {
        memberIds: arrayUnion(...memberIds),
      });
    } catch (error) {
      console.error('Error while adding members:', error);
      throw error;
    }
  }

  /**
   * Updates the channel information in Firestore and local state.
   * @param {string} channelId The ID of the channel to update
   * @param {string} name The new name for the channel
   * @param {string} description The new description for the channel
   * @returns {Promise<void>}
   */
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

  /**
   * Removes a member from a specified channel.
   * Updates the memberIds array in Firestore by removing the specified member.
   * @param {string} channelId The ID of the channel
   * @param {string} memberId The ID of the member to remove
   * @returns {Promise<void>}
   */
  async removeMemberFromChannel(
    channelId: string,
    memberId: string
  ): Promise<void> {
    const channelRef = doc(this.firestore, 'channels', channelId);
    await updateDoc(channelRef, {
      memberIds: arrayRemove(memberId),
    });
  }

  refreshCurrentChannel(): void {
    const currentChannelId = this.currentChannelIdSubject.value;
    if (!currentChannelId) return;

    const channelRef = doc(this.firestore, 'channels', currentChannelId);
    getDoc(channelRef)
      .then((channelSnapshot) => {
        if (channelSnapshot.exists()) {
          const channelData = channelSnapshot.data() as Channel;
          const updatedChannels = this.channelsSubject.value.map((channel) =>
            channel.channelId === currentChannelId
              ? { ...channel, ...channelData }
              : channel
          );
          this.channelsSubject.next(updatedChannels);
        }
      })
      .catch((error) => {
        console.error('Fehler beim Aktualisieren des aktuellen Kanals:', error);
      });
  }

  /**
   * Sets the current channel to display and triggers related events.
   * @param {string} channelId The ID of the channel to display
   * @returns {void}
   */
  displayChannel(channelId: string): void {
    this.setCurrentChannel(channelId);
  }

  /**
   * Updates the current channel ID.
   * Triggers the closeThreadBarEvent and channelChanged events.
   * @param {string} channelId The ID of the channel to set as current
   * @returns {void}
   */
  setCurrentChannel(channelId: string): void {
    this.currentChannelIdSubject.next(channelId);

    this.closeThreadBarEvent.emit();

    ///Event for autofocus inside chat component textarea
    this.channelChanged.emit();
  }

  /**
   * Creates a new private channel for direct messages between two users.
   * Initializes the channel with basic metadata and last read information.
   * @param {string} conversationId Unique identifier for the private conversation
   * @param {string} otherUserId ID of the other user in the private channel
   * @returns {Promise<string>} ID of the created private channel
   */
  async createPrivateChannel(
    conversationId: string,
    otherUserId: string
  ): Promise<string> {
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
      await setDoc(channelDocRef, newChannelData);
      const newChannel = Channel.fromFirestoreData(
        newChannelData,
        conversationId
      );
      const updatedChannels = [...this.channelsSubject.value, newChannel];
      this.channelsSubject.next(updatedChannels);

      return conversationId;
    } catch (error) {
      console.error('Error creating private channel:', error);
      throw error;
    }
  }
}
