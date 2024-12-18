import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
} from '@angular/fire/firestore';
import { Chat, ChatMessage } from '../../models/chat.model.class';
import { Message } from '../../models/interfaces/message.interface';
import { ProfileService } from './profile.service';
import { SearchService } from './search.service';
import { User } from 'firebase/auth';
import { AuthService } from './auth.service';
import { MessagesService } from './messages.service';
import { InfoFlyerService } from './info-flyer.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  emojiPickerChat: boolean = false;
  emojiPickerThreadChat: boolean = false;
  emojiPickerReactionChat: boolean = false;
  emojiPickerReactionThread: boolean = false;
  membersSearch: boolean = false;
  membersSearchThread = false;
  members: User[] = [];
  reactionMessageId: string = '';

  constructor(
    private firestore: Firestore,
    private profileService: ProfileService,
    private searchService: SearchService,
    private authService: AuthService,
    private messagesService: MessagesService,
    private infoService: InfoFlyerService
  ) {}

/**
 * Toggles the emoji picker for the text field, either in the main chat or thread chat.
 * @param {MouseEvent} event - The mouse event triggering the action.
 * @param {boolean} inChat - Indicates whether the action is for the main chat (true) or thread chat (false).
 */
toggleEmojiPickerTextField(event: MouseEvent, inChat: boolean) {
  this.profileService.preventDefault(event);
  if (!inChat) {
    this.emojiPickerThreadChat = !this.emojiPickerThreadChat;
  } else {
    this.emojiPickerChat = !this.emojiPickerChat;
  }
  this.emojiPickerReactionChat = false;
  this.emojiPickerReactionThread = false;
  this.searchService.closeSearch();
  this.membersSearch = false;
  this.membersSearchThread = false;
}

/**
 * Toggles the emoji picker for adding a reaction to a message.
 * @param {MouseEvent} event - The mouse event triggering the action.
 * @param {string} messageId - The ID of the message to which the reaction will be added.
 * @param {boolean} inChat - Indicates whether the action is for the main chat (true) or thread chat (false).
 */
toggleEmojiPickerReaction(event: MouseEvent, messageId: string, inChat: boolean) {
  this.profileService.preventDefault(event);
  this.reactionMessageId = messageId;
  if (inChat) {
    this.emojiPickerReactionChat = !this.emojiPickerReactionChat;
  } else {
    this.emojiPickerReactionThread = !this.emojiPickerReactionThread;
  }
  this.emojiPickerChat = false;
  this.emojiPickerThreadChat = false;
  this.membersSearch = false;
  this.membersSearchThread = false;
  this.searchService.closeSearch();
}

/**
 * Toggles the visibility of the members search, either in the main chat or thread chat.
 * @param {MouseEvent} event - The mouse event triggering the action.
 * @param {boolean} inChat - Indicates whether the action is for the main chat (true) or thread chat (false).
 */
toggleMembers(event: MouseEvent, inChat: boolean) {
  event.stopPropagation();
  if (inChat) {
    this.membersSearch = !this.membersSearch;
  } else {
    this.membersSearchThread = !this.membersSearchThread;
  }
  this.emojiPickerReactionChat = false;
  this.emojiPickerReactionThread = false;
  this.emojiPickerChat = false;
  this.emojiPickerThreadChat = false;
}

/**
 * Creates a formatted string by appending '@' to the given name and adds it to the text area.
 * @param {string} name - The name to be formatted and added to the text area.
 */
createString(name: string) {
  let increaseString = '@' + name;
  this.addStringToTextarea(increaseString);
  this.membersSearch = false;
  this.membersSearchThread = false;
}

/**
 * Closes all popups, including emoji pickers and member searches.
 */
closePopups() {
  this.emojiPickerChat = false;
  this.emojiPickerThreadChat = false;
  this.emojiPickerReactionChat = false;
  this.emojiPickerReactionThread = false;
  this.membersSearch = false;
  this.membersSearchThread = false;
}

/**
 * Adds an emoji as a reaction to a specific message.
 * @param {string} emoji - The emoji to be added as a reaction.
 * @returns {Promise<void>} - A promise that resolves once the reaction is added or displays an error message.
 */
async addEmojiAsReaction(emoji: string) {
  let messageId = '';
  if (this.reactionMessageId.length > 0) {
    messageId = this.reactionMessageId;
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
  this.closePopups();
  this.reactionMessageId = '';
}

/**
 * Inserts a given string at the cursor position in the appropriate text area.
 * @param {string} string - The string to be inserted into the text area.
 */
addStringToTextarea(string: string) {
  const textarea = document.getElementById(
    this.getRightChatField()
  ) as HTMLTextAreaElement;
  if (textarea) {
    const cursorPosition = textarea.selectionStart || 0;
    const textBeforeCursor = textarea.value.slice(0, cursorPosition);
    const textAfterCursor = textarea.value.slice(cursorPosition);
    textarea.value = textBeforeCursor + string + textAfterCursor;
    textarea.setSelectionRange(
      cursorPosition + string.length,
      cursorPosition + string.length
    );
    textarea.focus();
    this.closePopups();
  }
}

/**
 * Determines the correct chat field ID based on the current state.
 * @returns {string} - The ID of the correct chat field ('threadChat' or 'messageInput').
 */
getRightChatField(): string {
  if (this.membersSearchThread || this.emojiPickerThreadChat) {
    return 'threadChat';
  } else {
    return 'messageInput';
  }
}


  // Chat anlegen
  async createChat(chat: Chat): Promise<void> {
    const chatCollection = collection(this.firestore, 'chats');
    const chatDoc = doc(chatCollection); // Erstelle ein neues Dokument
    await setDoc(chatDoc, { ...chat }); // Speichere den Chat
  }

  // Nachricht in einem Chat anlegen
  async addMessageToChat(chatId: string, message: ChatMessage): Promise<void> {
    const chatMessagesCollection = collection(
      this.firestore,
      `chats/${chatId}/chatMessages`
    );
    const messageDoc = doc(chatMessagesCollection); // Erstelle ein neues Dokument
    await setDoc(messageDoc, { ...message }); // Speichere die Nachricht
  }

  // Alle Chats abrufen
  async getChats(): Promise<Chat[]> {
    const chatCollection = collection(this.firestore, 'chats');
    const querySnapshot = await getDocs(chatCollection);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Chat[];
  }

  messages: Message[] = [
    {
      messageId: 'message1',
      channelId: 'channel01',
      senderId: 'user123',
      senderName: 'Bob Johnson',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar1.svg',
      content: 'Hello everyone!',
      timestamp: new Date('2024-11-02T09:02:00Z'),
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
      messageId: 'message2',
      channelId: 'channel01',
      senderId: 'user456',
      senderName: 'Alice Wonderland',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar2.svg',
      content: 'Hey there! Whats up how is it going, the weather is so nice',
      timestamp: new Date('2024-11-13T15:10:00Z'),

      ///Thread messages counter here? Whenever a message in thread is added, this counter should be incremented
      ///or: by fetching the thread, you get the thread length. But then to get the "2 Antworten" below a message,
      ///you will need to fetch the thread data even if its not displayed yet...
      threadMessageCount: 3,
      threadId: 'thread26',
      lastThreadMessage: new Date('2024-11-18T02:11:00Z'),
    },
    {
      messageId: 'message3',
      channelId: 'channel01',
      senderId: 'user123',
      senderName: 'Michael Jordan',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar3.svg',
      content:
        'I´m great, thanks! After five years on the east coast... it was time to go home',
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadId: 'thread2623623s6',
      threadMessageCount: 2,
      lastThreadMessage: new Date('2024-11-17T00:10:00Z'),
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
      messageId: 'message34',
      channelId: 'channel01',
      senderId: 'user1234',
      senderName: 'Daniel Jackson',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar4.svg',
      content: 'How are you?',
      timestamp: new Date('2024-11-14T15:15:00Z'),
    },
    {
      messageId: 'message43',
      channelId: 'channel01',
      senderId: 'user1234',
      senderName: 'Daniel Jackson',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar4.svg',
      content:
        'Given that your messages are updated frequently and data changes are dynamic, using pipes is the easiest and most straightforward approach for your situation.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
    },

    // ...additional messages
  ];
}
