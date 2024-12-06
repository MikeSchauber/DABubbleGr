interface EnhancedUser extends User {
  conversationId: string;  // Always a string after generation
  messageCount: number;    // Always a number, defaults to 0 if no channel found
}

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { UserService } from '../../../../core/services/user.service';
import { combineLatest, map, Observable } from 'rxjs';
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
export class DirectMessagesComponent implements OnInit {
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
    this.currentUserId = this.authService.currentUserId;



    ///Roman neu: Combine usersData with conversationIds for currentUser, 
    ///combine each conversataionId with the fetched channel data, access Info, if other user posted new messages
    this.enhancedUsers$ = combineLatest([this.users$, this.channelService.channels$]).pipe(
      map(([users, channels]) => {
        if (!users) return [];
        return users.map((user): EnhancedUser => {
          const conversationId = this.generateConversationId(this.currentUserId, user.publicUserId);
          const channel = channels.find(ch => ch.conversationId === conversationId && ch.type === 'private');
          
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
  ngOnInit(): void {
    // Log the loaded users for debugging
    this.users$.subscribe((users) => {
      console.log('Loaded users in Direct Messages:', users);
    });



    




  }

  /**
   * Emits an event to toggle the visibility of the direct messages list.
   */
  onToggleDirectMessages(): void {
    this.toggleDirectMessages.emit();
  }




  // Roman Private Messages START
   // Roman Private Messages START
    // Roman Private Messages START

  openPrivateChat(conversationId: string){

    //generate conversational id 

    //check channels$ from channels service , if channels$ contain conversationId 

      //if yes => get the data, set currentChannel to conversationId 
      //if NO => create new channel with two members and type private. 
      //add new field: lastRead{user1: timestamp + message count, user2: timestamp + message count}  => update whenever user scrolls to bottom of the chat or posts a message.
      // set current channel to new created channel.



 
    //HTML in chat component header adapt to type - private (keine members , nur otherUser)





  }



  generateConversationId(currentUserId: string, otherUserId: string ): string { 
    return [currentUserId, otherUserId].sort().join('_'); 
  }

  // Roman Private Messages END
   // Roman Private Messages END
    // Roman Private Messages END

}
