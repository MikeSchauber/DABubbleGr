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
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { Channel } from '../../../models/channel.model.class';
import { User } from '../../../models/interfaces/user.interface';
import { MessagesService } from '../../../core/services/messages.service';
import { ThreadService } from '../../../core/services/thread.service';
import { LastThreadMsgDatePipe } from './pipes/last-thread-msg-date.pipe';
import { ShouldShowDateSeperatorPipe } from './pipes/should-show-date-seperator.pipe';
import { FormsModule } from '@angular/forms';
import { EmojiPickerComponent } from '../../../shared/emoji-picker/emoji-picker.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    DateSeperatorPipe,
    GetMessageTimePipe,
    ShouldShowDateSeperatorPipe,
    LastThreadMsgDatePipe,
    CommonModule,
    FormsModule,
    EmojiPickerComponent,
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
  enrichedMessages$: Observable<any[]>;

  @ViewChild('mainChatContentDiv') mainChatContentDiv!: ElementRef;

  mainChatContainer: any;
  currentUserId: string = '';
  currentChannel: any;
  @Output() openThreadBar = new EventEmitter<void>();
  shouldScrollToBottom = false;
  emojiPicker: boolean = false;

  constructor(
    public chatService: ChatService,
    public userService: UserService,
    public channelService: ChannelService,
    public messagesService: MessagesService,
    public threadService: ThreadService,
    public authService: AuthService
  ) {
    this.currentChannel$ = this.channelService.currentChannel$;
    this.usersCollectionData$ = this.userService.publicUsers$;
    this.channelMembers$ = this.channelService.channelMembers$;
    this.currentUserId = this.userService.currentUserId;
    this.enrichedMessages$ = this.messagesService.channelMessages$;
  }

  ngOnInit(): void {
    this.currentChannel$
      .pipe(takeUntil(this.destroy$)) // Automatically unsubscribe on destroy
      .subscribe((channel) => {
        this.currentChannel = channel;
        this.shouldScrollToBottom = true;
      });

    // Set flag when new messages are received
    this.enrichedMessages$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.isScrolledToBottom()) {
        ///hier nochmal checkn, ob die logik passt - wenn user ganz unten im chat ist, soll automatisch tiefer gescrollt werden, wenn jemand eine neu nachricht postet
        ///das scrollen soll nur auftreten, wenn user ganz unten im chat verlauf ist, weiter oben, soll die scroll position bleiben, damit user alte nachrichten in ruhe lesen kann
        this.shouldScrollToBottom = true;
      }
    });
// CurrentUserId Setzen

  }

  ngAfterViewInit() {
    this.mainChatContainer = this.mainChatContentDiv.nativeElement;
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
  openEmojiPicker() {
    this.emojiPicker = !this.emojiPicker;
  }

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
    const senderId = this.currentUserId;

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

  addReactionToMessage(
    messageId: string,
    emoji: string,
    currentUserId: string
  ) {
    this.messagesService.addReactionToMessage(messageId, emoji, currentUserId);
  }

  openEditPopup = false;

  editPopupMessageId: string | null = null; // Track the message ID for the currently open popup
  editMessageContent: string = '';

  toggleEditPopup(): void {
    this.openEditPopup = !this.openEditPopup;
    // Open or close the popup for the specific message
    // if (this.editPopupMessageId === messageId) {
    //   this.editPopupMessageId = null;
    //   this.editMessageContent = '';
    // } else {
    //   this.editPopupMessageId = messageId;
    //   const message = this.getMessageById(messageId); // Replace with logic to get the message content
    //   this.editMessageContent = message?.content || '';
    // }
  }

  editMessage(messageId: string) {}

  getMessageById(messageId: string): any | null {
    // let foundMessage: any | null = null;
    // // Subscribe to the observable to find the message
    // this.enrichedMessages$.pipe(take(1)).subscribe((messages) => {
    //   foundMessage = messages.find((msg: any) => msg.messageId === messageId);
    // });
    // return foundMessage;
  }

  closeEditPopup(): void {
    this.editPopupMessageId = null;
    this.editMessageContent = '';
  }

  saveEdit(messageId: string): void {
    // if (!this.editMessageContent.trim()) {
    //   console.warn('Cannot save empty content.');
    //   return;
    // }
    // this.messagesService.updateMessage(messageId, this.editMessageContent).subscribe(
    //   () => {
    //     console.log('Message updated');
    //     this.closeEditPopup();
    //   },
    //   (error) => console.error('Failed to update message', error)
    // );
  }

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

  //Beispiel für Sec Rules für thread Zugriff:
  // match /messages/{messageId} {
  //   allow read, write: if isChannelMember(request.auth.uid, resource.data.channelId);
  // }

  // match /threads/{threadId} {
  //   allow read, write: if isChannelMember(request.auth.uid, resource.data.channelId);
  // }

  // function isChannelMember(userId, channelId) {
  //   return exists(/databases/$(database)/documents/channels/$(channelId)) &&
  //          get(/databases/$(database)/documents/channels/$(channelId)).data.memberIds.hasAny([userId]);
  // }

  ///Kreiiere einen thread wenn noch keiner vorhanden:
  // startThread(parentMessageId: string, content: string) {
  //   // Check if thread already exists
  //   const parentMessageRef = this.firestore.collection('messages').doc(parentMessageId);
  //   parentMessageRef.get().subscribe(doc => {
  //     let threadId = doc.data().threadId;
  //     if (!threadId) {
  //       // Create a new thread
  //       threadId = this.createThread(parentMessageId);
  //       // Update the parent message to include the threadId
  //       parentMessageRef.update({ threadId });
  //     }
  //     // Send the first message in the thread
  //     this.sendMessageInThread(content, threadId);
  //   });
  // }
}
