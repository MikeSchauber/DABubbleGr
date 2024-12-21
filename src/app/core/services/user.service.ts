/**
 * @interface EnhancedUser
 * Represents a user with additional properties for private chat management.
 */
interface EnhancedUser extends User {
  /** Unique identifier for a conversation */
  conversationId: string;

  /** Number of unread messages for the current user in the channel */
  messageCount: number;
}

import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  shareReplay,
} from 'rxjs';
import { User } from '../../models/interfaces/user.interface';
import { AuthService } from './auth.service';
import { ChannelService } from './channel.service';
import { MobileControlService } from './mobile-control.service';

/**
* Service for managing users, enhancing user data, and handling private chats.
*/
@Injectable({
  providedIn: 'root',
})
export class UserService {
  /**
   * Subject containing the list of all public users fetched from Firestore.
   */
  private publicUsersSubject = new BehaviorSubject<User[] | null>([]);

  /**
   * Observable providing the list of all public users.
   */
  public publicUsers$ = this.publicUsersSubject.asObservable();

  /**
   * Observable providing enhanced user data by combining users with private chat metadata.
   */
  enhancedUsers$: Observable<EnhancedUser[] | null>;

  constructor(
    private firestore: Firestore,
    public authService: AuthService,
    public channelService: ChannelService,
    private mobileService: MobileControlService
  ) {
    this.loadPublicUserData();

    // Combine public users and channel data to generate enhanced user data
    this.enhancedUsers$ = combineLatest([this.publicUsers$, this.channelService.channels$]).pipe(
      map(([users, channels]) => {
        if (!users) return [];

        return users.map((user): EnhancedUser => {
          const conversationId = this.generateConversationId(
            this.authService.currentUserData.publicUserId,
            user.publicUserId
          );

          const channel = channels.find(
            (ch) => ch.type === 'private' && ch.conversationId === conversationId
          );

          const messageCount =
            channel?.lastReadInfo?.[this.authService.currentUserData.publicUserId]?.messageCount || 0;

          return { ...user, conversationId, messageCount };
        }).sort((a, b) => {
          if (a.publicUserId === this.authService.currentUserData.publicUserId) return -1;
          if (b.publicUserId === this.authService.currentUserData.publicUserId) return 1;
          return 0;
        });
      })
    );
  }

  /**
   * Generates a unique conversation ID for private chats.
   * @param currentUserId - The ID of the current user.
   * @param otherUserId - The ID of the other user in the chat.
   * @returns A unique string representing the conversation ID.
   */
  generateConversationId(currentUserId: string, otherUserId: string): string {
    return [currentUserId, otherUserId].sort().join('_');
  }

  /**
   * Loads all public user data from Firestore into the publicUsersSubject.
   */
  private loadPublicUserData(): void {
    const publicUserDataCollection = collection(this.firestore, 'publicUserData');
    const publicUserDataObservable = collectionData(publicUserDataCollection, {
      idField: 'publicUserId',
    }) as Observable<User[]>;

    publicUserDataObservable.subscribe({
      next: (publicUsers) => {
        this.publicUsersSubject.next(publicUsers);
      },
      error: (error) => {
        console.error('Error fetching public user data:', error);
      },
    });
  }

  /**
   * Returns a map of users for efficient lookups by publicUserId.
   * @returns An observable emitting a Map of user data indexed by user ID.
   */
  getUserMap$(): Observable<Map<string, User>> {
    return this.publicUsers$.pipe(
      map((users) => {
        const userMap = new Map<string, User>();
        users?.forEach((user) => userMap.set(user.publicUserId, user));
        return userMap;
      }),
      shareReplay(1)
    );
  }

  /**
   * Fetches all users from the Firestore collection.
   * @returns An observable emitting a list of all public users.
   */
  getUsers(): Observable<User[]> {
    const publicUserDataCollection = collection(this.firestore, 'publicUserData');
    return collectionData(publicUserDataCollection, { idField: 'id' }).pipe(
      map((users: any[]) =>
        users.map((user) => ({
          publicUserId: user.publicUserId,
          displayName: user.displayName,
          email: user.email,
          userStatus: user.userStatus,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          id: user.id,
        }))
      )
    );
  }

  /**
   * Fetches users by their IDs.
   * @param ids - An array of user IDs to retrieve.
   * @returns An observable emitting the users matching the given IDs.
   */
  getUsersByIds(ids: string[]): Observable<User[]> {
    return this.publicUsers$.pipe(
      map((users) => users?.filter((user) => ids.includes(user.publicUserId)) || [])
    );
  }

  /**
   * Opens a private chat with another user.
   * If a private channel already exists, it switches to it.
   * Otherwise, it creates a new private channel and opens it.
   * @param conversationId - The unique ID of the conversation.
   * @param otherUserId - The ID of the other user in the chat.
   */
  openPrivateChat(conversationId: string, otherUserId: string): void {
    this.mobileService.openChat();

    const channels = this.channelService.channelsSubject.value;

    const existingChannel = channels.find(
      (ch) => ch.type === 'private' && ch.channelId === conversationId
    );

    if (existingChannel) {
      this.channelService.setCurrentChannel(existingChannel.channelId);
    } else {
      this.channelService
        .createPrivateChannel(conversationId, otherUserId)
        .then((newChannelId) => {
          this.channelService.setCurrentChannel(newChannelId);
        })
        .catch((err) => console.error('Error creating private channel:', err));
    }
  }
}