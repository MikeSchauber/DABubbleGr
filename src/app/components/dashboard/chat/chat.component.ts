/**
 * @fileoverview Component for managing chat functionality in the application.
 * Handles message display, channel management, member interactions, message editing,
 * file attachments, and real-time updates.
 *
 * @requires @angular/core
 * @requires @angular/common
 * @requires @angular/forms
 * @requires rxjs
 */
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
import { UserService } from '../../../core/services/user.service';
import { ChannelService } from '../../../core/services/channel.service';
import {
  combineLatest,
  map,
  Observable,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { Channel } from '../../../models/channel.model.class';
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
  /** @private Subject for handling component cleanup */
  private destroy$ = new Subject<void>();

  /** @public Observable stream of the current channel */
  currentChannel$: Observable<Channel | null>;

  /** @public Observable stream of all users in the system */
  usersCollectionData$: Observable<User[] | null>;

  /** @public Observable stream of members in the current selected channel */
  channelMembers$!: Observable<User[]>;

  /** @public Observable stream of all users from the firebase collection publicUserData */
  users$: Observable<User[]> = new Observable<User[]>();

  /** @public Observable stream of messages */
  messages$: Observable<IMessage[]> | null = null;

  /** @public Observable stream of messages enriched with user details */
  enrichedMessages$: Observable<any[]> | null = null;

  /** @private Reference to the main chat content container for scroll functionality */
  @ViewChild('mainChatContentDiv') mainChatContentDiv!: ElementRef;

  /** @private Reference to the message input textarea for autofocus on channel change */
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

  /** @public Event emitter for opening the thread sidebar */
  @Output() openThreadBar = new EventEmitter<void>();

  mainChatContainer: any;
  currentUserId: string = '';
  currentChannel: any;

  isEditMembersPopupOpen: boolean = false;

  /** @private Flag for controlling scroll behavior */
  shouldScrollToBottom = false;

  //Edit messages variables//

  /** @public Flag for controlling edit channel popup visibility */
  editChannelPopupVisible: boolean = false;

  /** @private Reference to the edit message textarea */
  @ViewChild('editTextarea') editTextarea!: ElementRef<HTMLTextAreaElement>;

  /** @public Flag for edit members popup visibility */
  editMembersPopupVisible = false;

  /** @private ID of the currently open edit popup */
  currentEditPopupId: string | null = null;

  /** @private ID of the message being edited */
  editingMessageId: string | null = null;

  /** @private Content of the message being edited */
  editMessageContent: string = '';

  /** @private Flag for controlling textarea focus */
  focusTextarea = false;

  //Image attachment
  /** @private Maximum file size for attachments in bytes (0.5MB) */
  private readonly MAX_FILE_SIZE = 512000; // 0.5MB in bytes

  /** @public Current attachment pending upload */
  pendingAttachment: Attachment | null = null;

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

  /**
   * Initializes the component and sets up message and channel streams
   * Sets up message streams with user data enrichment -
   * mapping publicUserId inside channelMember array to displayName and avatar from publicUserData collection
   * Enriching messages and reactions with the mapped displayNames and avatars.
   * @returns {void}
   */
  ngOnInit(): void {
    this.channelMembers$ = this.memberService.channelMembers$;
    this.currentChannel$.pipe(takeUntil(this.destroy$)).subscribe((channel) => {
      this.currentChannel = channel;
      this.shouldScrollToBottom = true;
    });
    this.messages$ = this.channelService.currentChannelId$.pipe(
      switchMap((channelId) => {
        if (channelId) {
          return this.messagesService.getMessagesForChannel(channelId);
        } else {
          return [];
        }
      })
    );

    ///Get DisplayName inside messages and reactions through accessing the usersCollectionData$
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

    // Scroll to bottom always up to date
    this.enrichedMessages$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.isScrolledToBottom()) {
        this.shouldScrollToBottom = true;
      }
    });
  }

  /**
   * Initializes the chat container after view initialization
   * @returns {void}
   */
  ngAfterViewInit() {
    this.mainChatContainer = this.mainChatContentDiv.nativeElement;
  }

  /**
   * Handles DOM updates after view check
   * Manages auto-scrolling and textarea focus.
   * schedules the callback function to be executed after the current call stack is cleared.
   * Fires when all synchronous operations, like updating the DOM, finish.
   * @returns {void}
   */
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      setTimeout(() => {
        this.scrollToBottom();
        this.shouldScrollToBottom = false;
      });
    }
    if (this.focusTextarea && this.editTextarea) {
      this.editTextarea.nativeElement.focus();
      this.focusTextarea = false;
    }
  }

  scrollToBottom(): void {
    if (this.mainChatContainer) {
      this.mainChatContainer.scrollTo({
        top: this.mainChatContainer.scrollHeight,
        behavior: 'smooth',
      });
    }
  }

  /**
   * Checks if the chat container is scrolled to bottom
   * Uses a threshold to account for slight variations
   * @returns {boolean} True if scrolled to bottom within threshold
   */
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

  /**
   * Opens the thread bar for a specific message
   * @param {string} messageId ID of the message to open thread for
   * @returns {void}
   */
  onOpenThreadBar(messageId: string) {
    this.threadService.setCurrentThread(messageId);
    this.messagesService.setSelectedMessage(messageId);
    this.openThreadBar.emit();
    this.mobileService.openThread();
  }

  /**
   * Performs cleanup when component is destroyed
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  //Edit functions

  /**
   * Toggles the edit popup for a message
   * @param {string} messageId ID of the message to toggle edit popup for
   * @returns {void}
   */
  toggleEditPopup(messageId: string): void {
    if (this.currentEditPopupId === messageId) {
      this.currentEditPopupId = null;
    } else {
      this.currentEditPopupId = messageId;
    }
  }

  closePopup(): void {
    this.currentEditPopupId = null;
  }

  onMouseLeave(messageId: string): void {
    if (this.currentEditPopupId === messageId) {
      this.closePopup();
    }
  }

  /**
   * Handles document click events for popup management (edit popup).
   * @param {MouseEvent} event The click event
   * @returns {void}
   */
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

  /**
   * Initiates message editing
   * @param {string} messageId ID of the message to edit
   * @param {string} content Current content of the message
   * @returns {void}
   */
  startEditMessage(messageId: string, content: string): void {
    this.editingMessageId = messageId;
    this.editMessageContent = content;

    this.focusTextarea = true;
  }

  cancelEdit(): void {
    this.editingMessageId = null;
    this.editMessageContent = '';
    this.currentEditPopupId = null;
  }

  /**
   * Saves edited message content
   * @param {string} messageId ID of the message being edited
   * @param {string} oldMessageContent Previous content of the message
   * @param {number} attachmentLength Number of attachments
   * @returns {void}
   */
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
        this.cancelEdit(); // Close the overlay
      })
      .catch((error) => {
        console.error('Failed to update message:', error);
      });
  }

  /**
   * Checks if a channel is a private channel to self
   * @param {Channel | null} channel Channel to check
   * @returns {boolean} True if channel is private to self
   */
  isPrivateChannelToSelf(channel: Channel | null): boolean {
    if (!channel || !channel.memberIds) return false; // Ensure channel and memberIds exist
    return channel.memberIds.every(
      (id) => id === this.authService.currentUserData.publicUserId
    );
  }

  /**
   * Gets placeholder text for textarea based on channel type
   * @param {Channel | null} channel Current channel
   * @param {User[] | null} members Channel members
   * @returns {string} Placeholder text
   */
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

  /**
   * Checks if textarea should be disabled
   * @param {Channel | null} channel Current channel
   * @returns {boolean} True if input should be disabled
   */
  isDisabled(channel: Channel | null): boolean {
    return channel?.channelId === 'newMessage';
  }

  /**
   * Adds a reaction to a message
   * @param {string} messageId ID of the message
   * @param {string} emoji Emoji to add as reaction
   * @param {string} currentUserId ID of the user adding the reaction
   * @returns {void}
   */
  addReactionToMessage(
    messageId: string,
    emoji: string,
    currentUserId: string
  ) {
    this.messagesService.addReactionToMessage(messageId, emoji, currentUserId);
  }

  /**
   * Initiates channel editing or opens profile dialog
   * @returns {void}
   */
  editChannel() {
    if (!this.currentChannel) {
      console.error('No current channel selected for editing.');
      return;
    }
    if (this.currentChannel.type !== 'private') {
      this.editChannelPopupVisible = true;
    } else {
      this.openTheCorrectProfileDialog();
    }
  }

  /**
   * Updates channel details
   * @param {Object} updatedData New channel data
   * @param {string} updatedData.name New channel name
   * @param {string} updatedData.description New channel description
   * @returns {Promise<void>}
   */
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
      .then(() => {})
      .catch((error) => {
        console.error('Error updating channel:', error);
      });
  }

  /**
   * Updates channel members list
   * @param {string[]} updatedMembers Array of member IDs to add
   * @returns {void}
   */
  onMembersUpdated(updatedMembers: string[]): void {
    if (this.currentChannel) {
      const currentMemberIds = this.currentChannel.memberIds || [];
      this.channelService.refreshCurrentChannel();
      this.currentChannel.memberIds = [
        ...new Set([...currentMemberIds, ...updatedMembers]),
      ];
    }
  }

  /**
   * Shows member selection popup for adding members
   * @returns {void}
   */
  addMembersToChannel(): void {
    if (!this.currentChannel) {
      console.error(
        'Kein aktueller Kanal ausgewählt, um Mitglieder hinzuzufügen.'
      );
      return;
    }

      this.editMembersPopupVisible = true;
    
  }

  /**
   * Opens appropriate profile dialog based on channel type
   * @returns {void}
   */
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

  /**
   * Gets the ID of the other member in a private channel
   * @param {string} id1 First member ID
   * @param {string} id2 Second member ID
   * @returns {string} ID of the other member
   */
  getOtherMemberId(id1: string, id2: string): string {
    const myId = this.authService.currentUserData.publicUserId;
    return id1 === myId ? id2 : id1;
  }

  //Image attachment to message start

  /**
   * Handles file upload for message attachments
   * @param {Event} event The file input event
   * @returns {void}
   */
  handleImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];

    if (!file) {
      console.warn('No file selected');
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      this.infoService.createInfo('File size exceeds 0.5MB limit', true);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    this.convertToBase64(file);
  }

  /**
   * Converts uploaded file to base64 string
   * @private
   * @param {File} file The file to convert
   * @returns {void}
   */
  private convertToBase64(file: File): void {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result as string;
      this.pendingAttachment = {
        type: 'image',
        url: base64String,
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

  /**
   * Handles message sending with optional attachments
   * @param {string} content The message content
   * @returns {void}
   */
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
      attachments: this.pendingAttachment ? [this.pendingAttachment] : [],
    };

    this.messagesService
      .postMessage(currentChannelId, senderId, messageData)
      .then(() => {
        this.pendingAttachment = null;
        if (this.messageInput) {
          this.messageInput.nativeElement.value = '';
        }
        this.scrollToBottom();
      })
      .catch((error) => {
        console.error('Error sending message:', error);
      });
  }

  ////////////////// TESTING FUNCTIONS START \\\\\\\\\\\\\\\\\
  populateDummyChannels() {
    this.dummyDataService
      .addDummyChannels()
      .then(() => {
        this.infoService.createInfo('Dummy channels have been added.', false);
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
        this.infoService.createInfo('Error removing member from channel', true);
      });
  }

  private loadChannelMembers(): void {
    if (!this.currentChannel?.memberIds) return;

    this.channelMembers$ = this.userService.getUsersByIds(
      this.currentChannel.memberIds
    );
  }

  /**
   * Closes the currently visible popup.
   */
  closePopupVisibility(): void {
    this.editChannelPopupVisible = false;
    this.editMembersPopupVisible = false;
  }
}
