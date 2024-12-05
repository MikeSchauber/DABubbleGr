import { animate, style, transition, trigger } from '@angular/animations';
import { AfterViewChecked, AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DateSeperatorPipe } from '../chat/pipes/date-seperator.pipe';
import { GetMessageTimePipe } from '../chat/pipes/get-message-time.pipe';
import { ShouldShowDateSeperatorPipe } from '../chat/pipes/should-show-date-seperator.pipe';
import { ChatService } from '../../../core/services/chat.service';
import { Message } from '../../../models/interfaces/message.interface';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { ChannelService } from '../../../core/services/channel.service';
import { combineLatest, firstValueFrom, map, Observable, shareReplay, Subject, take, takeUntil } from 'rxjs';
import { IMessage } from '../../../models/interfaces/message2interface';
import { ThreadService } from '../../../core/services/thread.service';
import { Channel } from '../../../models/channel.model.class';
import { MessagesService } from '../../../core/services/messages.service';
import { AuthService } from '../../../core/services/auth.service';


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
export class ThreadBarComponent implements OnInit, AfterViewChecked {

  private destroy$ = new Subject<void>(); 
  currentChannel$: Observable<Channel | null>;

    // Get the selected message from MessagesService
  selectedMessage$ : Observable<IMessage | null>;
  // threadMessages$: Observable<IMessage[] >;
  enrichedThreadMessages$: Observable<any[]> = new Observable();

  currentUserId: string= '';
  messages: Message[]= [];
  currentChannel: any;

  
  @Input() threadId!: string;

  @ViewChild('mainThreadContentDiv', { static: false }) mainThreadContentDiv!: ElementRef;
  mainThreadContainer: any;
  shouldScrollToBottom = false;

  @Output() close = new EventEmitter<void>();


  constructor(
    public chatService: ChatService,
    public userService: UserService,
    public channelService: ChannelService,
    private threadService: ThreadService,
    private messagesService: MessagesService,
    public authService: AuthService
  ) {
    this.currentUserId = authService.currentUserData.publicUserId;

    // Initialize currentChannel$ from channelService
    this.currentChannel$ = this.channelService.currentChannel$;

    // Subscribe to currentChannel$ if you need the currentChannel synchronously
    this.currentChannel$
      .pipe(takeUntil(this.destroy$))
      .subscribe((channel) => {
        this.currentChannel = channel;
        this.shouldScrollToBottom = true;
      });

    // this.threadMessages$ = this.threadService.threadMessages$;

    this.selectedMessage$ = this.messagesService.selectedMessage$;
  }


  ngOnInit(): void {

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
      ),shareReplay(1)
    );

    // Subscribe to enrichedThreadMessages$ to detect new messages
    this.enrichedThreadMessages$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.isScrolledToBottom()) {
        this.shouldScrollToBottom = true;
      }
    });
  }

  ngAfterViewChecked() {
    if (this.mainThreadContentDiv) {
      this.mainThreadContainer = this.mainThreadContentDiv.nativeElement;}

      if (this.shouldScrollToBottom) {
        // Ensure DOM updates are completed before scrolling
        setTimeout(() => {
          this.scrollToBottom();
          this.shouldScrollToBottom = false;
        });
      }
    

  }

  closeThreadBar() {
    this.close.emit();
  }

  isScrolledToBottom(): boolean {
    if (!this.mainThreadContainer) return false;
    const threshold = 50; // Adjust as needed
    return (
      this.mainThreadContainer.scrollHeight -
        this.mainThreadContainer.scrollTop -
        this.mainThreadContainer.clientHeight <=
      threshold
    );
  }

  scrollToBottom(): void {
    if (this.mainThreadContainer) {
      this.mainThreadContainer.scrollTo({
        top: this.mainThreadContainer.scrollHeight,
        behavior: 'smooth', // Enable smooth scrolling
      });
    }
  }

  addReactionToMessage(messageId: string, emoji: string, currentUserId: string) {
    this.messagesService.addReactionToMessage(messageId, emoji, currentUserId);
  }


  async sendMessage(content: string): Promise<void> {
    if (!content.trim()) {
      console.warn('Cannot send an empty message.');
      return;
    }
  
    try {
      const selectedMessage = await firstValueFrom(this.selectedMessage$);
      if (!selectedMessage || !selectedMessage.messageId) {
        console.error('No thread selected or invalid thread.');
        return;
      }
  
      const parentMessageId = selectedMessage.messageId;
  
      const senderId = this.currentUserId;
      if (!senderId) {
        console.error('User ID is missing.');
        return;
      }
  
      await this.threadService.postThreadMessage(parentMessageId, senderId, content);
      console.log('Thread message sent successfully.');
      // Optionally, clear the input field and scroll to bottom
      this.shouldScrollToBottom = true;
    } catch (error) {
      console.error('Error sending thread message:', error);
    }
  }







}


// async deleteMessage(messageId: string): Promise<void> {
//   try {
//     const currentThreadId = await firstValueFrom(this.currentThreadId$);
//     if (!currentThreadId) {
//       console.error('No thread selected or invalid thread.');
//       return;
//     }

//     await this.threadService.deleteThreadMessage(messageId, currentThreadId);
//     console.log('Thread message deleted successfully.');
//   } catch (error) {
//     console.error('Error deleting thread message:', error);
//   }
// }