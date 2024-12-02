import { animate, style, transition, trigger } from '@angular/animations';
import { Component, EventEmitter, Output } from '@angular/core';
import { DateSeperatorPipe } from '../chat/pipes/date-seperator.pipe';
import { GetMessageTimePipe } from '../chat/pipes/get-message-time.pipe';
import { ShouldShowDateSeperatorPipe } from '../chat/pipes/should-show-date-seperator.pipe';
import { ChatService } from '../../../core/services/chat.service';
import { Message } from '../../../models/interfaces/message.interface';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { ChannelService } from '../../../core/services/channel.service';
import { combineLatest, map, Observable, Subject, takeUntil } from 'rxjs';
import { IMessage } from '../../../models/interfaces/message2interface';
import { ThreadService } from '../../../core/services/thread.service';
import { Channel } from '../../../models/channel.model.class';
// import { Channel } from '../../../models/interfaces/channel.interace';

@Component({
  selector: 'app-thread-bar',
  standalone: true,
  imports: [DateSeperatorPipe, GetMessageTimePipe, ShouldShowDateSeperatorPipe, CommonModule],
  templateUrl: './thread-bar.component.html',
  styleUrls: ['./thread-bar.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('150ms ease-in-out', style({ transform: 'translateX(0%)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in-out', style({ transform: 'translateX(100%)' })),
      ]),
    ]),
  ],
})
export class ThreadBarComponent {

  private destroy$ = new Subject<void>(); 
  currentChannel$: Observable<Channel | null>;
  threadMessages$: Observable<IMessage[] >;
  enrichedThreadMessages$: Observable<any[]> = new Observable();

  currentUserId: string= '';
  messages: Message[]= [];
  currentChannel: any;

  @Output() close = new EventEmitter<void>();
  constructor(
    public chatService: ChatService,
    public userService: UserService,
    public channelService: ChannelService,
    private threadService: ThreadService
  ) {
    this.currentUserId = this.userService.currentUserId;

    // Initialize currentChannel$ from channelService
    this.currentChannel$ = this.channelService.currentChannel$;

    // Subscribe to currentChannel$ if you need the currentChannel synchronously
    this.currentChannel$
      .pipe(takeUntil(this.destroy$))
      .subscribe((channel) => {
        this.currentChannel = channel;
      });

    this.threadMessages$ = this.threadService.threadMessages$;
  }


  ngOnInit(): void {
    // this.messages = this.chatService.messages;

    // this.threadMessages$ = this.threadService.threadMessages$;

    // this.threadMessages$ = combineLatest([
    //   this.threadService.threadMessages$,
    //   this.userService.getUserMap$(),
    // ]).pipe(
    //   map(([messages, userMap]) =>
    //     messages.map((message) => ({
    //       ...message,
    //       senderName: userMap.get(message.senderId)?.displayName || 'Unknown User',
    //       senderAvatarUrl: userMap.get(message.senderId)?.avatarUrl || 'default-avatar-url',
    //       // ...other enrichments
    //     }))
    //   )
    // );

    this.enrichedThreadMessages$ = combineLatest([
      this.threadService.threadMessages$,
      this.userService.getUserMap$(),
    ]).pipe(
      map(([messages, userMap]) =>
        messages.map((message) => ({
          ...message,
          senderName: userMap.get(message.senderId)?.displayName || 'Unknown User',
          senderAvatarUrl: userMap.get(message.senderId)?.avatarUrl || 'default-avatar-url',
          enrichedReactions: message.reactions?.map((reaction) => ({
            ...reaction,
            users: reaction.userIds.map(
              (userId) => userMap.get(userId)?.displayName || 'Unknown User'
            ),
          })),
        }))
      )
    );
  }

  closeThreadBar() {
    this.close.emit();
  }
}
