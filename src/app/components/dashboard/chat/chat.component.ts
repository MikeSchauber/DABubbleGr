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
import { ShouldShowDateSeperatorPipe } from './pipes/should-show-date-seperator.pipe';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../../core/services/chat.service';
import { Message } from '../../../models/interfaces/message.interface';
import { Thread } from '../../../models/interfaces/thread.interface';
import { UserService } from '../../../core/services/user.service';
import { ChannelService } from '../../../core/services/channel.service';
import {
  combineLatest,
  map,
  Observable,
  shareReplay,
  Subject,
  take,
  switchMap,
  takeUntil,
  of,
} from 'rxjs';
import { Channel } from '../../../models/channel.model.class';
import { serverTimestamp } from 'firebase/firestore';
import { User } from '../../../models/interfaces/user.interface';
import { MessagesService } from '../../../core/services/messages.service';
import { IMessage } from '../../../models/interfaces/message2interface';
import { ThreadService } from '../../../core/services/thread.service';
import { EditMembersPopupComponent } from './edit-members-popup/edit-members-popup.component';
import { AuthService } from '../../../core/services/auth.service';
import { EmojiPickerComponent } from '../../../shared/emoji-picker/emoji-picker.component';
import { ProfileService } from '../../../core/services/profile.service';
import { LastThreadMsgDatePipe } from './pipes/last-thread-msg-date.pipe';
import { FormsModule } from '@angular/forms';
import { EditChannelPopupComponent } from './edit-channel-popup/edit-channel-popup.component';
import { IsPrivateChannelToSelfPipe } from './pipes/is-private-channel-to-self.pipe';
import { SearchService } from '../../../core/services/search.service';
import { MemberService } from '../../../core/services/member.service';
import { DirectSearchComponent } from './direct-search/direct-search.component';
import { MembersSearchComponent } from './members-search/members-search.component';
import { Attachment } from '../../../models/interfaces/attachment.interface';
import { InfoFlyerService } from '../../../core/services/info-flyer.service';
import { MobileControlService } from '../../../core/services/mobile-control.service';
import { DummyDataService } from '../../../core/services/dummy-data.service';

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
    DirectSearchComponent,
    MembersSearchComponent,
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
  channelMembers$!: Observable<User[]>;
  users$: Observable<User[]> = new Observable<User[]>();

  messages$: Observable<IMessage[]> | null = null; // Reactive message stream
  enrichedMessages$: Observable<any[]> | null = null; // Combine messages with user details

  @ViewChild('mainChatContentDiv') mainChatContentDiv!: ElementRef;

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

  mainChatContainer: any;
  currentUserId: string = '';
  currentChannel: any;
  @Output() openThreadBar = new EventEmitter<void>();
  shouldScrollToBottom = false;
  editChannelPopupVisible: boolean = false;

  constructor(
    public chatService: ChatService,
    public userService: UserService,
    public channelService: ChannelService,
    public messagesService: MessagesService,
    public threadService: ThreadService,
    public authService: AuthService,
    public profileService: ProfileService,
    public searchService: SearchService,
    public memberService: MemberService,
    public infoService: InfoFlyerService,
    public mobileService: MobileControlService,
    public dummyDataService: DummyDataService
  ) {
    this.currentChannel$ = this.channelService.currentChannel$;
    this.usersCollectionData$ = this.userService.publicUsers$;

    this.enrichedMessages$ = this.messagesService.channelMessages$;
    document.addEventListener('click', this.onDocumentClick.bind(this));

    this.channelService.channelChanged
      .pipe(takeUntil(this.destroy$)) // Automatically unsubscribe when destroy$ emits
      .subscribe(() => {
        this.focusTextareaFunction();
      });
  }

  trackByUserId(index: number, user: any): string {
    return user.userId;
  }

  focusTextareaFunction(): void {
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }

  ngOnInit(): void {
    this.channelMembers$ = this.memberService.channelMembers$;

    // Subscribe to currentChannel$ to update the currentChannel variable
    this.currentChannel$
      .pipe(takeUntil(this.destroy$)) // Automatically unsubscribe on destroy
      .subscribe((channel) => {
        this.currentChannel = channel;
        this.shouldScrollToBottom = true;
        console.log('Current channel member IDs:', channel?.memberIds);
        console.log('Created By:', channel?.createdBy);
      });

    // React to changes in the currentChannelId and fetch messages dynamically
    this.messages$ = this.channelService.currentChannelId$.pipe(
      switchMap((channelId) => {
        if (channelId) {
          return this.messagesService.getMessagesForChannel(channelId);
        } else {
          return []; // Return empty array if no channelId
        }
      })
    );

    ///Get DisplayName inside reactions through accessing the usersCollectionData$
    this.enrichedMessages$ = combineLatest([
      this.messages$,
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
      takeUntil(this.destroy$) // Ensure cleanup to prevent memory leaks
    );

    // Set flag when new messages are received
    this.enrichedMessages$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.isScrolledToBottom()) {
        ///hier nochmal checkn, ob die logik passt - wenn user ganz unten im chat ist, soll automatisch tiefer gescrollt werden, wenn jemand eine neu nachricht postet
        ///das scrollen soll nur auftreten, wenn user ganz unten im chat verlauf ist, weiter oben, soll die scroll position bleiben, damit user alte nachrichten in ruhe lesen kann
        this.shouldScrollToBottom = true;
      }
    });
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

    ///Edit popup autofocus
    if (this.focusTextarea && this.editTextarea) {
      this.editTextarea.nativeElement.focus();
      this.focusTextarea = false;
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
    // console.log("onOpenThreadBar in chat component, messageId:", messageId)
    this.threadService.setCurrentThread(messageId);
    this.messagesService.setSelectedMessage(messageId); 
    this.openThreadBar.emit();
    this.mobileService.openThread();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  // Edit messages logic //

  editMembersPopupVisible = false;
  currentEditPopupId: string | null = null;
  editingMessageId: string | null = null;
  editMessageContent: string = '';
  focusTextarea = false;
  @ViewChild('editTextarea') editTextarea!: ElementRef<HTMLTextAreaElement>;

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

    this.focusTextarea = true;
  }

  cancelEdit(): void {
    this.editingMessageId = null;
    this.editMessageContent = '';
    this.currentEditPopupId = null;
  }

  saveMessageEdit(
    messageId: string,
    oldMessageContent: string,
    attachmentLength: number
  ): void {
    // Allow empty content if there are attachments
    const hasAttachments = attachmentLength > 0;
    const contentIsEmpty = !this.editMessageContent.trim();

    // Prevent saving if content is empty AND there are no attachments
    if (contentIsEmpty && !hasAttachments) {
      console.warn('Cannot save empty content without attachments.');
      this.currentEditPopupId = null;
      return;
    }

    // Check if content is unchanged
    if (this.editMessageContent === oldMessageContent) {
      console.log('Message identical, no message edit');
      this.currentEditPopupId = null;
      this.cancelEdit();
      return;
    }

    // Create the update object with new fields
    const updateData = {
      content:
        contentIsEmpty && hasAttachments ? '' : this.editMessageContent.trim(),
      edited: true,
      lastEdit: new Date(),
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
    return channel.memberIds.every(
      (id) => id === this.authService.currentUserData.publicUserId
    );
  }

  getPlaceholder(channel: Channel | null, members: User[] | null): string {
    if (channel?.channelId === 'newMessage') {
      return 'Starte eine neue Nachricht';
    }

    if (channel?.type === 'private') {
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
      return `Nachricht an #${channel?.name}`;
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

 async onChannelUpdated(updatedData: { name: string; description: string }) {
    if (!this.currentChannel?.channelId) {
      console.error('No current channel selected for updating.');
      return;
    }
    await this.channelService
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

  onMembersUpdated(updatedMembers: string[]): void {
    if (this.currentChannel) {
      const currentMemberIds = this.currentChannel.memberIds || [];
      this.currentChannel.memberIds = [
        ...new Set([...currentMemberIds, ...updatedMembers]),
      ];
      console.log('Updated members:', this.currentChannel.memberIds);
    }
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


//////////////////image attachment to message start
private readonly MAX_FILE_SIZE = 512000; // 0.5MB in bytes
pendingAttachment: Attachment | null = null;

handleImageUpload(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input?.files?.[0];
  
  if (!file) {
    console.warn('No file selected');
    return;
  }

  if (file.size > this.MAX_FILE_SIZE) {
    alert('File size exceeds 0.5MB limit');
    return;
  }

  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }

  this.convertToBase64(file);
}

private convertToBase64(file: File): void {
  const reader = new FileReader();
  
  reader.onload = () => {
    const base64String = reader.result as string;
    this.pendingAttachment = {
      type: 'image',
      url: base64String
    };
  };

  reader.onerror = (error) => {
    console.error('Error converting image to Base64:', error);
    this.pendingAttachment = null;
  };

  reader.readAsDataURL(file);
}

removePendingAttachment(): void {
  this.pendingAttachment = null;
}


sendMessage(content: string): void {
  if (!content.trim() && !this.pendingAttachment) {
    console.warn('Cannot send an empty message without attachment.');
    return;
  }

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

  const messageData = {
    content: content.trim(),
    attachments: this.pendingAttachment ? [this.pendingAttachment] : []
  };

  this.messagesService
    .postMessage(currentChannelId, senderId, messageData)
    .then(() => {
      console.log('Message sent successfully.');
      this.pendingAttachment = null; // Clear the attachment after sending
      if (this.messageInput) {
        this.messageInput.nativeElement.value = ''; // Clear the input
      }
      this.scrollToBottom();
    })
    .catch((error) => {
      console.error('Error sending message:', error);
    });
}


async addEmojiAsReaction(emoji: string) {
  let messageId = '';
  if (this.chatService.reactionMessageId.length > 0) {
    messageId = this.chatService.reactionMessageId;
  } else {
    this.infoService.createInfo(
      'Reaction konnte nicht hinzugefügt werden',
      true
    );
    return;
  }
  await this.messagesService.addReactionToMessage(
    messageId,
    emoji,
    this.authService.currentUserData.publicUserId
  );
  this.chatService.closePopups();
  this.chatService.reactionMessageId = '';
}



  ////////////////// TESTING FUNCTIONS START \\\\\\\\\\\\\\\\\
  ////////////////// TESTING FUNCTIONS START \\\\\\\\\\\\\\\\\
  ////////////////// TESTING FUNCTIONS START \\\\\\\\\\\\\\\\\

  populateDummyChannels() {
    this.dummyDataService
      .addDummyChannels()
      .then(() => {
        console.log('Dummy channels have been added.');
      })
      .catch((error) => {
        console.error('Error adding dummy channels:', error);
      });
  }

  populateDummyChannelsWithDummyMembers() {
    this.dummyDataService.populateChannelsWithMembers();
  }

  resetPublicUserData() {
    this.dummyDataService.resetPublicUserData();
  }

  createMessagesCollection() {
    this.dummyDataService.createMessagesCollection();
  }

  createThreadMessages() {
    this.dummyDataService.createThreadMessages();
  }
  ////////////////// TESTING FUNCTIONS END \\\\\\\\\\\\\\\\\
  ////////////////// TESTING FUNCTIONS END \\\\\\\\\\\\\\\\\
  ////////////////// TESTING FUNCTIONS END \\\\\\\\\\\\\\\\\


  
  removeMember(memberId: string): void {
    if (!this.currentChannel) return;
  
    this.channelService
      .removeMemberFromChannel(this.currentChannel.channelId, memberId)
      .then(() => {
        // Remove member locally from the current channel
        const updatedMembers = this.currentChannel.memberIds.filter(
          (id: string) => id !== memberId
        );
        this.currentChannel.memberIds = updatedMembers;
  
        // Reload local members
        this.loadChannelMembers();
      })
      .catch((error) => {
        console.error('Error removing member from channel:', error);
      });
  }
  
  private loadChannelMembers(): void {
    if (!this.currentChannel?.memberIds) return;
  
    this.channelMembers$ = this.userService.getUsersByIds(
      this.currentChannel.memberIds
    );
  
    // Optional: Log updated members for debugging
    this.channelMembers$.subscribe((members) =>
      console.log('Updated channel members:', members)
    );
  }
  
}
