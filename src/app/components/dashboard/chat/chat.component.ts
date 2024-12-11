import {
  Component,
  EventEmitter,
  Output,
  ViewChild,
  ElementRef,
  OnInit,
  AfterViewInit,
  AfterViewChecked,
  OnDestroy,
} from '@angular/core';
import { DateSeperatorPipe } from './pipes/date-seperator.pipe';
import { GetMessageTimePipe } from './pipes/get-message-time.pipe';

import { CommonModule } from '@angular/common';
import { ChatService } from '../../../core/services/chat.service';
import { Message } from '../../../models/interfaces/message.interface';
import { Thread } from '../../../models/interfaces/thread.interface';
import { UserService } from '../../../core/services/user.service';
import { ChannelService } from '../../../core/services/channel.service';
import { combineLatest, map, Observable, shareReplay, Subject, take, takeUntil } from 'rxjs';
import { Channel } from '../../../models/channel.model.class';
import { User } from '../../../models/interfaces/user.interface';
import { MessagesService } from '../../../core/services/messages.service';
import { ThreadService } from '../../../core/services/thread.service';

import { EditMembersPopupComponent } from './edit-members-popup/edit-members-popup.component';
import { ShouldShowDateSeperatorPipe } from './pipes/should-show-date-seperator.pipe';
import { IMessage } from '../../../models/interfaces/message2interface';
import { AuthService } from '../../../core/services/auth.service';
import { EmojiPickerComponent } from '../../../shared/emoji-picker/emoji-picker.component';
import { ProfileService } from '../../../core/services/profile.service';
import { LastThreadMsgDatePipe } from './pipes/last-thread-msg-date.pipe';
import { FormsModule } from '@angular/forms';
import { EditChannelPopupComponent } from './edit-channel-popup/edit-channel-popup.component';
import { IsPrivateChannelToSelfPipe } from './pipes/is-private-channel-to-self.pipe';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    DateSeperatorPipe,
    GetMessageTimePipe,
    ShouldShowDateSeperatorPipe,
    LastThreadMsgDatePipe,
    IsPrivateChannelToSelfPipe,
    LastThreadMsgDatePipe,
    CommonModule,
    EditMembersPopupComponent,
    FormsModule,
    EmojiPickerComponent,
    EditChannelPopupComponent,
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss', '../../../../styles.scss'],
})
export class ChatComponent
  implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy
{
  private destroy$ = new Subject<void>(); // Emits when the component is destroyed
  currentChannel$: Observable<Channel | null>;
  usersCollectionData$: Observable<User[] | null>;
  channelMembers$: Observable<User[]>;

  messages$: Observable<IMessage[]> | null = null; // Reactive message stream
  enrichedMessages$: Observable<any[]> | null = null; // Combine messages with user details

  @ViewChild('mainChatContentDiv') mainChatContentDiv!: ElementRef;

  mainChatContainer: any;
  currentUserId: string = '';
  currentChannel: any;
  @Output() openThreadBar = new EventEmitter<void>();
  shouldScrollToBottom = false;
  editChannelPopupVisible: boolean = false;
  editMembersPopupVisible = false;
  currentEditPopupId: string | null = null;
  editingMessageId: string | null = null;
  editMessageContent: string = '';

  constructor(
    public chatService: ChatService,
    public userService: UserService,
    public channelService: ChannelService,
    public messagesService: MessagesService,
    public threadService: ThreadService,
    public authService: AuthService,
    public profileService: ProfileService
  ) {
    this.currentChannel$ = this.channelService.currentChannel$;
    this.usersCollectionData$ = this.userService.publicUsers$;



    this.channelMembers$ = combineLatest([
    this.currentChannel$,
    this.userService.publicUsers$
  ]).pipe(
    map(([channel, users]) => {
      if (!channel || !users) return [];
      const memberIds = channel.memberIds || [];
      // Filter users to only include channel members
      return users.filter(user => memberIds.includes(user.publicUserId));
    }),
    shareReplay(1)
  );








    // this.currentUserId = this.userService.currentUserId;
    //this.currentUserId = this.authService.currentUserData.publicUserId;

    this.enrichedMessages$ = this.messagesService.channelMessages$;

    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnInit(): void {
    this.currentChannel$
      .pipe(takeUntil(this.destroy$)) // Automatically unsubscribe on destroy
      .subscribe((channel) => {
        this.currentChannel = channel;
        this.shouldScrollToBottom = true;
      });

    // Set flag when new messages are received
    if (this.enrichedMessages$) {
      this.enrichedMessages$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.isScrolledToBottom()) {
          ///hier nochmal checkn, ob die logik passt - wenn user ganz unten im chat ist, soll automatisch tiefer gescrollt werden, wenn jemand eine neu nachricht postet
          ///das scrollen soll nur auftreten, wenn user ganz unten im chat verlauf ist, weiter oben, soll die scroll position bleiben, damit user alte nachrichten in ruhe lesen kann
          this.shouldScrollToBottom = true;
        }
      });
    }

    // CurrentUserId Setzen
  }

  ngAfterViewInit() {
    if (this.mainChatContentDiv) {
      this.mainChatContainer = this.mainChatContentDiv.nativeElement;
    } else {
      console.warn('mainChatContentDiv not found yet.');
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      ///settimeout without milliseconds waits 0 ms BUT: schedules the callback function to be executed after the current call stack is cleared!
      //Fires when all synchronous operations, like updating the DOM, finish.
      setTimeout(() => {
        this.scrollToBottom();
        this.shouldScrollToBottom = false;
      });
    }
  }

  // Emoji Picker Funktionen:
  // Wählt anhand der Cursor Position im Textfeld das einsetzen des Strings
  addEmojiToTextarea(emoji: string) {
    const textarea = document.getElementById(
      'messageInput'
    ) as HTMLTextAreaElement;
    if (textarea) {
      const cursorPosition = textarea.selectionStart || 0;
      const textBeforeCursor = textarea.value.slice(0, cursorPosition);
      const textAfterCursor = textarea.value.slice(cursorPosition);
      // Emoji an aktueller Cursorposition einfügen
      textarea.value = textBeforeCursor + emoji + textAfterCursor;
      textarea.setSelectionRange(
        cursorPosition + emoji.length,
        cursorPosition + emoji.length
      );
      textarea.focus();
    }
  }

  scrollToBottom(): void {
    if (this.mainChatContainer) {
      this.mainChatContainer.scrollTo({
        top: this.mainChatContainer.scrollHeight,
        behavior: 'smooth', // Enable smooth scrolling
      });
    }
  }

  //////////still open to do: Only scroll down when user is at the bottom of the chat and a new message arrives
  //////////still open to do: Only scroll down when user is at the bottom of the chat and a new message arrives
  //////////still open to do: Only scroll down when user is at the bottom of the chat and a new message arrives
  isScrolledToBottom(): boolean {
    if (!this.mainChatContainer) return false;
    const threshold = 50; // A small buffer to account for slight variations
    return (
      this.mainChatContainer.scrollHeight -
        this.mainChatContainer.scrollTop -
        this.mainChatContainer.clientHeight <=
      threshold
    );
  }

  onOpenThreadBar(messageId: string) {
    ///ParentMessage should be on top of thread
    this.messagesService.setSelectedMessage(messageId);
    this.threadService.setCurrentThread(messageId);
    this.openThreadBar.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  // Edit messages logic //

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

  startEditMessage(messageId: string, content: string): void {
    this.editingMessageId = messageId;
    this.editMessageContent = content; // Pre-fill with current message content
  }

  cancelEdit(): void {
    this.editingMessageId = null;
    this.editMessageContent = '';
  }

  saveMessageEdit(messageId: string): void {
    if (!this.editMessageContent.trim()) {
      console.warn('Cannot save empty content.');
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
        console.log('Message updated successfully');
        this.cancelEdit(); // Close the overlay
      })
      .catch((error) => {
        console.error('Failed to update message:', error);
      });
  }

  //Check in html template if currentChannel is the self
  isPrivateChannelToSelf(channel: Channel | null): boolean {
    if (!channel || !channel.memberIds) return false; // Ensure channel and memberIds exist
    console.log(channel.memberIds);
    return channel.memberIds.every((id) => id === this.authService.currentUserData.publicUserId);
  }

  sendMessage(content: string): void {
    if (!content.trim()) {
      console.warn('Cannot send an empty message.');
      return;
    }

    // Ensure currentChannel is available and has a channelId
    if (!this.currentChannel?.channelId) {
      console.error('No channel selected or invalid channel.');
      return;
    }

    const currentChannelId = this.currentChannel.channelId;
    const senderId = this.authService.currentUserData.publicUserId;

    if (!senderId) {
      console.error('User ID is missing.');
      return;
    }

    this.messagesService
      .postMessage(currentChannelId, senderId, content)
      .then(() => {
        console.log('Message sent successfully.');
        this.scrollToBottom();
      })
      .catch((error) => {
        console.error('Error sending message:', error);
      });
  }

  getPlaceholder(channel: Channel | null, members: User[] | null): string {
    if (!channel) {
      return 'Starte eine neue Nachricht';
    }

    if (channel.type === 'private') {
      // Identify the other member (if any)
      if (!members) return 'Starte eine neue Nachricht';

      const otherMember = members.find(
        (m) => m.publicUserId !== this.authService.currentUserData.publicUserId
      );
      if (!otherMember) {
        // private channel to self
        return 'Nachricht an dich selbst';
      } else {
        return `Nachricht an ${otherMember.displayName}`;
      }
    } else {
      // For public channels or others
      return `Nachricht an #${channel.name}`;
    }
  }

  addReactionToMessage(
    messageId: string,
    emoji: string,
    currentUserId: string
  ) {
    this.messagesService.addReactionToMessage(messageId, emoji, currentUserId);
  }

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

  onChannelUpdated(updatedData: { name: string; description: string }): void {
    if (!this.currentChannel?.channelId) {
      console.error('No current channel selected for updating.');
      return;
    }

    this.channelService
      .updateChannel(
        this.currentChannel.channelId,
        updatedData.name,
        updatedData.description
      )
      .then(() => {
        console.log('Channel successfully updated.');
      })
      .catch((error) => {
        console.error('Error updating channel:', error);
      });
  }

  onMembersUpdated(updatedMembers: string[]) {
    this.currentChannel.memberIds = updatedMembers;
    console.log('Updated members:', updatedMembers);
  }

  addMembersToChannel(): void {
    if (!this.currentChannel) {
      console.error(
        'Kein aktueller Kanal ausgewählt, um Mitglieder hinzuzufügen.'
      );
      return;
    }

    // Setze die Sichtbarkeit des Mitglieder-Popups auf true
    this.editMembersPopupVisible = true;
  }

  trackByUserId(index: number, user: any): string {
    return user.userId;
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

  ////////////////// TESTING FUNCTIONS START \\\\\\\\\\\\\\\\\
  ////////////////// TESTING FUNCTIONS START \\\\\\\\\\\\\\\\\
  ////////////////// TESTING FUNCTIONS START \\\\\\\\\\\\\\\\\

  threads: Thread[] = [
    {
      ///thread should look nearly identical to a message object, just without further threads... or ?
      threadId: 'thread1',
      parentMessageId: 'message162',
      channelId: 'channel01',
      createdAt: new Date('2024-11-13T15:05:00Z'),
      createdBy: 'user456',
      attachments: [
        {
          type: 'image',
          url: 'https://example.com/image.png',
        },
      ],
      reactions: [
        {
          emoji: '🚀',
          userIds: ['user456', 'user456115', 'user4568888'],
        },
        {
          emoji: '🌟',
          userIds: ['user12367'],
        },
      ],
    },
    // ...additional threads
  ];

  threadMessages: Message[] = [
    {
      messageId: 'threadmessage1',
      channelId: 'channel01', ///channelId optional
      senderId: 'user123',
      senderName: 'Bob Johnson',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar1.svg',
      content: 'Hello everyone!',
      timestamp: new Date('2024-11-02T09:02:00Z'),
      threadId: 'thread26',
      parentMessageId: 'message2',

      attachments: [
        {
          type: 'image',
          url: 'https://example.com/image.png',
        },
      ],
      reactions: [
        {
          emoji: '👍',
          userIds: ['user456', 'user12367'],
        },
      ],
    },
    {
      messageId: 'threadmessage422',
      channelId: 'channel01',
      senderId: 'user456',
      senderName: 'Alice Wonderland',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar2.svg',
      content: 'Hey there! Whats up how is it going, the weather is so nice',
      timestamp: new Date('2024-11-13T15:10:00Z'),
      threadId: 'thread26',
      parentMessageId: 'message2',
    },
    {
      messageId: 'threadmessage3515',
      channelId: 'channel01',
      senderId: 'user123',
      senderName: 'Michael Jordan',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar3.svg',
      content:
        'I´m great, thanks! After five years on the east coast... it was time to go home',
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadId: 'thread26',
      parentMessageId: 'message2',
      reactions: [
        {
          emoji: '🚀',
          userIds: ['user456', 'user456115', 'user4568888'],
        },
        {
          emoji: '🌟',
          userIds: ['user12367'],
        },
      ],
    },
    {
      messageId: 'threadmessage34111',
      channelId: 'channel01',
      senderId: 'user1234',
      senderName: 'Daniel Jackson',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar4.svg',
      content: 'How are you?',
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadId: 'thread2623623s6',
      parentMessageId: 'message3',
    },
    {
      messageId: 'message43999',
      channelId: 'channel01',
      senderId: 'user1234',
      senderName: 'Daniel Jackson',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar4.svg',
      content:
        'Given that your messages are updated frequently and data changes are dynamic, using pipes is the easiest and most straightforward approach for your situation.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'thread2623623s6',
      parentMessageId: 'message2',
    },
  ];

  populateDummyChannels() {
    this.channelService
      .addDummyChannels()
      .then(() => {
        console.log('Dummy channels have been added.');
      })
      .catch((error) => {
        console.error('Error adding dummy channels:', error);
      });
  }

  populateDummyChannelsWithDummyMembers() {
    this.channelService.populateChannelsWithMembers();
  }

  resetPublicUserData() {
    this.channelService.resetPublicUserData();
  }

  createMessagesCollection() {
    this.messagesService.createMessagesCollection();
  }

  createThreadMessages() {
    this.threadService.createThreadMessages();
  }
  ////////////////// TESTING FUNCTIONS END \\\\\\\\\\\\\\\\\
  ////////////////// TESTING FUNCTIONS END \\\\\\\\\\\\\\\\\
  ////////////////// TESTING FUNCTIONS END \\\\\\\\\\\\\\\\\
}
