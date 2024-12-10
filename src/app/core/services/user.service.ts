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

interface EnhancedUser extends User {
  conversationId: string; // Always a string after generation
  messageCount: number; // Always a number, defaults to 0 if no channel found
}
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private publicUsersSubject = new BehaviorSubject<User[] | null>([]);
  public publicUsers$ = this.publicUsersSubject.asObservable();
  currentUserId: string = '';
  /** Observable for the list of public users from the UserService */
  users$: Observable<User[] | null>;
  enhancedUsers$: Observable<EnhancedUser[] | null>;

  constructor(
    private firestore: Firestore,
    public authService: AuthService,
    private channelService: ChannelService
  ) {
    this.loadPublicUserData();
    this.currentUserId = this.authService.currentUserData.publicUserId;
    // Load public users from the UserService
    this.users$ = this.publicUsers$;
    ///Roman neu: Combine usersData with conversationIds for currentUser,
    ///combine each conversataionId with the fetched channel data, access Info, if other user posted new messages
    this.enhancedUsers$ = combineLatest([
      this.users$,
      this.channelService.channels$,
    ]).pipe(
      map(([users, channels]) => {
        if (!users) return [];
        const enhancedUsers = users.map((user): EnhancedUser => {
          const conversationId = this.generateConversationId(
            this.currentUserId,
            user.publicUserId
          );
          const channel = channels.find(
            (ch) =>
              ch.type === 'private' && ch.conversationId === conversationId
          );

          let messageCount = 0;
          if (channel?.lastReadInfo?.[this.currentUserId]) {
            messageCount =
              channel.lastReadInfo[this.currentUserId].messageCount;
          }

          return {
            ...user,
            conversationId,
            messageCount,
          };
        });

        // Sort so that the current user is at the top
        return enhancedUsers.sort((a, b) => {
          if (a.publicUserId === this.currentUserId) return -1;
          if (b.publicUserId === this.currentUserId) return 1;
          return 0;
        });
      })
    );
  }

  generateConversationId(currentUserId: string, otherUserId: string): string {
    return [currentUserId, otherUserId].sort().join('_');
  }

  private loadPublicUserData() {
    const publicUserDataCollection = collection(
      this.firestore,
      'publicUserData'
    );
    const publicUserDataObservable = collectionData(publicUserDataCollection, {
      idField: 'publicUserId',
    }) as Observable<User[]>;

    publicUserDataObservable.subscribe({
      next: (publicUsers) => {
        this.publicUsersSubject.next(publicUsers);
        // console.log('Fetched public user data:', publicUsers);
      },
      error: (error) => {
        console.error('Error fetching public user data:', error);
      },
    });
  }

  // Create a map for user lookups by publicUserId
  getUserMap$(): Observable<Map<string, User>> {
    return this.publicUsers$.pipe(
      map((users) => {
        const userMap = new Map<string, User>();
        users?.forEach((user) => {
          userMap.set(user.publicUserId, user);
        });
        return userMap;
      }),
      shareReplay(1)
    );
  }

  // Fetch all users from the Firestore collection
  getUsers(): Observable<User[]> {
    const publicUserDataCollection = collection(
      this.firestore,
      'publicUserData'
    );
    return collectionData(publicUserDataCollection, { idField: 'id' }).pipe(
      map((users: any[]) =>
        users.map((user) => ({
          publicUserId: user.publicUserId,
          displayName: user.displayName,
          email: user.email,
          userStatus: user.userStatus, // Ensure this matches 'online', 'away', or 'offline'
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          // Map additional fields
          name: user.displayName,
          avatar: user.avatarUrl,
          authId: user.publicUserId,
          id: user.id, // Ensure 'id' exists in the collection or generate one
        }))
      )
    );
  }
}
