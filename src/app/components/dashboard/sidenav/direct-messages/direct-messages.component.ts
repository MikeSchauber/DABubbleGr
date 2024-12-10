import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
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

  constructor(
    public userService: UserService,
    public authService: AuthService,
    public channelService: ChannelService
  ) {
    //Roman neu
    this.currentUserId = authService.currentUserData.publicUserId;
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
    // this.users$.pipe(takeUntil(this.destroy$)).subscribe((users) => {
    //   // console.log('Loaded users in Direct Messages:', users);
    // });
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
    const existingChannel = channels.find(
      (ch) => ch.type === 'private' && ch.channelId === conversationId
    );

    if (existingChannel) {
      // If channel exists, set current channel
      this.channelService.setCurrentChannel(existingChannel.channelId);
    } else {
      // If no channel exists, create a new private channel
      this.channelService
        .createPrivateChannel(conversationId, otherUserId)
        .then((newChannelId) => {
          // After creation, set current channel
          this.channelService.setCurrentChannel(newChannelId);
        })
        .catch((err) => console.error('Error creating private channel:', err));
    }
  }

  // Roman Private Messages END
}
