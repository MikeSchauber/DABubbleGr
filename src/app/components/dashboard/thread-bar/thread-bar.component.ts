import { animate, style, transition, trigger } from '@angular/animations';
import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  DoCheck,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { DateSeperatorPipe } from '../chat/pipes/date-seperator.pipe';
import { GetMessageTimePipe } from '../chat/pipes/get-message-time.pipe';
import { ShouldShowDateSeperatorPipe } from '../chat/pipes/should-show-date-seperator.pipe';
import { ChatService } from '../../../core/services/chat.service';
import { Message } from '../../../models/interfaces/message.interface';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { ChannelService } from '../../../core/services/channel.service';
import {
  combineLatest,
  firstValueFrom,
  map,
  Observable,
  shareReplay,
  Subject,
  take,
  takeUntil,
} from 'rxjs';
import { IMessage } from '../../../models/interfaces/message2interface';
import { ThreadService } from '../../../core/services/thread.service';
import { Channel } from '../../../models/channel.model.class';
import { MessagesService } from '../../../core/services/messages.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { LastThreadMsgDatePipe } from '../chat/pipes/last-thread-msg-date.pipe';
import { User } from '../../../models/interfaces/user.interface';
import { MemberService } from '../../../core/services/member.service';
import { ProfileService } from '../../../core/services/profile.service';
import { IsPrivateChannelToSelfPipe } from '../chat/pipes/is-private-channel-to-self.pipe';
import { MobileControlService } from '../../../core/services/mobile-control.service';
import { EmojiPickerComponent } from '../../../shared/emoji-picker/emoji-picker.component';
import { MembersSearchComponent } from '../chat/members-search/members-search.component';

@Component({
  selector: 'app-thread-bar',
  standalone: true,
  imports: [
    DateSeperatorPipe,
    GetMessageTimePipe,
    ShouldShowDateSeperatorPipe,
    CommonModule,
    FormsModule,
    LastThreadMsgDatePipe,
    IsPrivateChannelToSelfPipe,
    EmojiPickerComponent,
    MembersSearchComponent
  ],
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
export class ThreadBarComponent
  implements OnInit, AfterViewChecked, OnDestroy, DoCheck
{
  private destroy$ = new Subject<void>();
  currentChannel$: Observable<Channel | null>;
  channelMembers$!: Observable<User[]>;

  // Get the selected message from MessagesService
  selectedMessage$: Observable<IMessage | null>;
  // threadMessages$: Observable<IMessage[] >;
  enrichedThreadMessages$: Observable<any[]> = new Observable();

  currentUserId: string = '';
  messages: Message[] = [];
  currentChannel: any;

  @Input() threadId!: string;

  @ViewChild('mainThreadContentDiv', { static: false })
  mainThreadContentDiv!: ElementRef;
  mainThreadContainer: any;
  shouldScrollToBottom = false;

  @Output() close = new EventEmitter<void>();

  constructor(
    public chatService: ChatService,
    public userService: UserService,
    public channelService: ChannelService,
    private threadService: ThreadService,
    private messagesService: MessagesService,
    public authService: AuthService,
    public memberService: MemberService,
    public profileService: ProfileService,
    public mobileService: MobileControlService
  ) {
    this.currentUserId = authService.currentUserData.publicUserId;

    // Initialize currentChannel$ from channelService
    this.currentChannel$ = this.channelService.currentChannel$;

    // Subscribe to currentChannel$ if you need the currentChannel synchronously
    this.currentChannel$.pipe(takeUntil(this.destroy$)).subscribe((channel) => {
      this.currentChannel = channel;
      this.shouldScrollToBottom = true;
    });

    // this.threadMessages$ = this.threadService.threadMessages$;

    this.selectedMessage$ = this.messagesService.selectedMessage$;

    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnInit(): void {
    this.channelMembers$ = this.memberService.channelMembers$;

    this.enrichedThreadMessages$ = combineLatest([
      this.threadService.threadMessages$,
      this.userService.getUserMap$(),
    ]).pipe(
      map(([messages, userMap]) =>
        messages.map((message) => ({
          ...message,
          senderName:
            userMap.get(message.senderId)?.displayName || 'Unknown User',
          senderAvatarUrl:
            userMap.get(message.senderId)?.avatarUrl || 'default-avatar-url',
          enrichedReactions: message.reactions?.map((reaction) => ({
            ...reaction,
            users: reaction.userIds.map(
              (userId) => userMap.get(userId)?.displayName || 'Unknown User'
            ),
          })),
        }))
      ),
      shareReplay(1)
    );

    // Subscribe to enrichedThreadMessages$ to detect new messages
    this.enrichedThreadMessages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isScrolledToBottom()) {
          this.shouldScrollToBottom = true;
        }
      });
  }

  ngAfterViewChecked() {
    if (this.mainThreadContentDiv) {
      this.mainThreadContainer = this.mainThreadContentDiv.nativeElement;
    }

    if (this.shouldScrollToBottom) {
      // Ensure DOM updates are completed before scrolling
      setTimeout(() => {
        this.scrollToBottom();
        this.shouldScrollToBottom = false;
      });
    }

    //Autofcous textarea when threadbar opens
    if (this.shouldFocusTextarea && this.threadMessageInput && this.isVisible) {
      // Small delay to ensure animation is complete
      setTimeout(() => {
        this.threadMessageInput.nativeElement.focus();
        this.shouldFocusTextarea = false;
      }, 200);
    }

    ///Edit popup autofocus
    if (this.focusTextarea && this.editTextareaThread) {
      this.editTextareaThread.nativeElement.focus();
      this.focusTextarea = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  closeThreadBar() {
    this.close.emit();
    this.mobileService.openChat();
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

  addReactionToMessage(
    messageId: string,
    emoji: string,
    currentUserId: string
  ) {
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

      await this.threadService.postThreadMessage(
        parentMessageId,
        senderId,
        content
      );
      // Optionally, clear the input field and scroll to bottom
      this.shouldScrollToBottom = true;
    } catch (error) {
      console.error('Error sending thread message:', error);
    }
  }

  ///Edit message

  // Edit messages logic //

  currentEditPopupId: string | null = null;
  editingMessageId: string | null = null;
  editMessageContent: string = '';

  toggleEditPopup(messageId: string): void {
    if (this.currentEditPopupId === messageId) {
      this.currentEditPopupId = null; // Close the popup if already open
    } else {
      this.currentEditPopupId = messageId; // Open the popup for the specific message
    }
  }

  closePopup(): void {
    this.currentEditPopupId = null; // Close all popups
  }

  onMouseLeave(messageId: string): void {
    if (this.currentEditPopupId === messageId) {
      this.closePopup();
    }
  }

  onDocumentClick(event: MouseEvent): void {
    // Check if the clicked element is inside an open popup
    const target = event.target as HTMLElement;
    if (
      !target.closest('.edit-popup') &&
      !target.closest('.hover-button-class')
    ) {
      this.closePopup(); // Close popup if click is outside
    }
  }

  focusTextarea = false;
  @ViewChild('editTextareaThread')
  editTextareaThread!: ElementRef<HTMLTextAreaElement>;
  startEditMessage(messageId: string, content: string): void {
    this.editingMessageId = messageId;
    this.editMessageContent = content; // Pre-fill with current message content
    this.focusTextarea = true;
  }

  cancelEdit(): void {
    this.editingMessageId = null;
    this.editMessageContent = '';
    this.currentEditPopupId = null;
  }

  saveMessageEdit(messageId: string, oldMessageContent: string): void {
    if (!this.editMessageContent.trim()) {
      console.warn('Cannot save empty content.');
      this.currentEditPopupId = null;
      return;
    }
    if (this.editMessageContent == oldMessageContent) {
      this.currentEditPopupId = null;
      this.cancelEdit();
      return;
    }

    // Create the update object with new fields
    const updateData = {
      content: this.editMessageContent,
      edited: true, // Mark the message as edited
      lastEdit: new Date(), // Use server timestamp
    };

    // Call the service to update the message
    this.messagesService
      .updateMessage(messageId, updateData)
      .then(() => {
        this.cancelEdit(); // Close the overlay
      })
      .catch((error) => {
        console.error('Failed to update message:', error);
      });
  }

  editChannelPopupVisible: boolean = false;

  editChannel() {
    if (!this.currentChannel) {
      console.error('No current channel selected for editing.');
      return;
    }
    //Neu Mike
    if (this.currentChannel.type !== 'private') {
      this.editChannelPopupVisible = true;
    } else {
      this.openTheCorrectProfileDialog();
    }
  }
  // Neu Mike
  openTheCorrectProfileDialog() {
    const currentChannel = this.currentChannel;
    let member1 = currentChannel.memberIds[0];
    let member2 = currentChannel.memberIds[1];
    if (member1 === member2) {
      this.profileService.toggleProfileDisplay();
    } else {
      let otherMemberId = this.getOtherMemberId(member1, member2);
      this.profileService.toggleOtherDisplay(otherMemberId);
    }
  }
  // Neu Mike
  getOtherMemberId(id1: string, id2: string): string {
    const myId = this.authService.currentUserData.publicUserId;
    return id1 === myId ? id2 : id1;
  }

  ///Autofocus auf textarea when threadbar is opened
  @ViewChild('threadMessageInput')
  threadMessageInput!: ElementRef<HTMLTextAreaElement>;
  private shouldFocusTextarea = true;

  // Add isVisible input to track thread bar visibility
  @Input() isVisible: boolean = false;
  private previousVisibility: boolean = false;

  ngDoCheck() {
    // Check if visibility has changed to true
    if (this.isVisible && !this.previousVisibility) {
      this.shouldFocusTextarea = true;
    }
    this.previousVisibility = this.isVisible;
  }
}
