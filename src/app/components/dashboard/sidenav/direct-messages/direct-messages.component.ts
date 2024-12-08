interface EnhancedUser extends User {
  conversationId: string;  // Always a string after generation
  messageCount: number;    // Always a number, defaults to 0 if no channel found
}

import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { combineLatest, map, Observable, Subject, take, takeUntil } from 'rxjs';
import { User } from '../../../../models/interfaces/user.interface';
import { AuthService } from '../../../../core/services/auth.service';
import { ChannelService } from '../../../../core/services/channel.service';

/**
 * @class DirectMessagesComponent
 * @description Displays and manages the list of direct messages (users) and allows toggling the visibility of the list.
 */
@Component({
  selector: 'app-direct-messages',
  templateUrl: './direct-messages.component.html',
  styleUrls: ['./direct-messages.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class DirectMessagesComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  /** Observable for the list of public users from the UserService */
  users$: Observable<User[] | null>;
  enhancedUsers$: Observable<EnhancedUser[] | null>;
  //Roman neu
  currentUserId: string = '';

  /** List of users passed from the parent component */
  @Input() users: {
    name: string;
    avatar: string;
    userStatus: 'online' | 'away' | 'offline';
  }[] = [];

  /** Indicates whether the direct messages list is expanded */
  @Input() isDirectMessagesExpanded: boolean = true;

  /** Indicates if the arrow is hovered */
  @Input() isArrowHovered: boolean = false;

  /** Event emitted to toggle the visibility of the direct messages list */
  @Output() toggleDirectMessages = new EventEmitter<void>();

  constructor(private userService: UserService,
              private authService: AuthService,
              private channelService: ChannelService
  ) {
    // Load public users from the UserService
    this.users$ = this.userService.publicUsers$;


    //Roman neu
    this.currentUserId = authService.currentUserData.publicUserId;



    ///Roman neu: Combine usersData with conversationIds for currentUser, 
    ///combine each conversataionId with the fetched channel data, access Info, if other user posted new messages
    this.enhancedUsers$ = combineLatest([this.users$, this.channelService.channels$]).pipe(
      map(([users, channels]) => {
        if (!users) return [];
        return users.map((user): EnhancedUser => {
          const conversationId = this.generateConversationId(this.currentUserId, user.publicUserId);
          const channel = channels.find(ch => ch.type === 'private' && ch.conversationId === conversationId );
          
          let messageCount = 0;
          if (channel?.lastReadInfo?.[this.currentUserId]) {
            messageCount = channel.lastReadInfo[this.currentUserId].messageCount;
          }
    
          return {
            ...user,
            conversationId,
            messageCount
          };
        });
      })
    );
  }

  /**
   * Lifecycle hook to initialize the component.
   */
  // ngOnInit(): void {
  //   // Log the loaded users for debugging
  //   this.users$.subscribe((users) => {
  //     console.log('Loaded users in Direct Messages:', users);
  //   });
  // }
  ngOnInit(): void {
    this.users$.pipe(takeUntil(this.destroy$)).subscribe((users) => {
      // console.log('Loaded users in Direct Messages:', users);
    });
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Emits an event to toggle the visibility of the direct messages list.
   */
  onToggleDirectMessages(): void {
    this.toggleDirectMessages.emit();
  }




  // Roman Private Messages START


  openPrivateChat(conversationId: string, otherUserId: string): void {


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


  generateConversationId(currentUserId: string, otherUserId: string ): string { 
    return [currentUserId, otherUserId].sort().join('_'); 
  }

    // Roman Private Messages END

}
