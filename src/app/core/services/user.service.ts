interface EnhancedUser extends User {
  conversationId: string;  // Always a string after generation
  messageCount: number;    // Always a number, defaults to 0 if no channel found
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

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private publicUsersSubject = new BehaviorSubject<User[] | null>([]);
  public publicUsers$ = this.publicUsersSubject.asObservable();

  enhancedUsers$: Observable<EnhancedUser[] | null>;

  constructor(
    private firestore: Firestore,
    public authService: AuthService,
    public channelService: ChannelService,
    private mobileService: MobileControlService
  ) {
    this.loadPublicUserData();
    // this.currentUserId = this.authService.currentUserData.publicUserId;



       ///Roman neu: Combine usersData with conversationIds for currentUser, 
    ///combine each conversataionId with the fetched channel data, access Info, if other user posted new messages
    this.enhancedUsers$ = combineLatest([this.publicUsers$, this.channelService.channels$]).pipe(
      map(([users, channels]) => {
        if (!users) return [];
        const enhancedUsers = users.map((user): EnhancedUser => {
          const conversationId = this.generateConversationId(this.authService.currentUserData.publicUserId, user.publicUserId);
          const channel = channels.find(ch => ch.type === 'private' && ch.conversationId === conversationId);
          
          let messageCount = 0;
          if (channel?.lastReadInfo?.[this.authService.currentUserData.publicUserId]) {
            messageCount = channel.lastReadInfo[this.authService.currentUserData.publicUserId].messageCount;
          }
    
          return {
            ...user,
            conversationId,
            messageCount
          };
        });
    
        // Sort so that the current user is at the top
        return enhancedUsers.sort((a, b) => {
          if (a.publicUserId === this.authService.currentUserData.publicUserId) return -1;
          if (b.publicUserId === this.authService.currentUserData.publicUserId) return 1;
          return 0;
        });
      })
    );

  }


  generateConversationId(currentUserId: string, otherUserId: string ): string { 
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


    /**
   * Fetches users by their IDs.
   * 
   * @param ids Array of user IDs to retrieve
   * @returns Observable emitting the array of users matching the given IDs
   */
    getUsersByIds(ids: string[]): Observable<User[]> {
      return this.publicUsers$.pipe(
        map((users) => (users ? users.filter((user) => ids.includes(user.publicUserId)) : []))
      );
    }

  openPrivateChat(conversationId: string, otherUserId: string): void {

    this.mobileService.openChat();
    // console.log('Current User ID:', this.currentUserId);
    // console.log('Other User ID:', otherUserId);
    // console.log('Generated Conversation ID:', this.generateConversationId(this.currentUserId, otherUserId));
    // Fetch the latest channels synchronously
    const channels = this.channelService.channelsSubject.value;
  
    // Find the existing channel
    const existingChannel = channels.find(ch => ch.type === 'private' && ch.channelId === conversationId);
  
    if (existingChannel) {
      // If channel exists, set current channel
      this.channelService.setCurrentChannel(existingChannel.channelId);
    } else {
      // If no channel exists, create a new private channel
      this.channelService.createPrivateChannel(conversationId, otherUserId)
        .then(newChannelId => {
          // After creation, set current channel
          this.channelService.setCurrentChannel(newChannelId);
        })
        .catch(err => console.error('Error creating private channel:', err));
    }
  }


}
