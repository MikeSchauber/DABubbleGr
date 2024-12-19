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

  /**
  * Creates a new chat in the Firestore database.
  * @param chat - The chat object containing details such as title, participants, and metadata.
  * @returns A promise that resolves when the chat is successfully created.
  */
  async createChat(chat: Chat): Promise<void> {
    const chatCollection = collection(this.firestore, 'chats');
    const chatDoc = doc(chatCollection); 
    await setDoc(chatDoc, { ...chat }); 
  }

  /**
  * Adds a new message to a specific chat in the Firestore database.
  * @param chatId - The ID of the chat to which the message will be added.
  * @param message - The message object containing details like sender, content, and timestamp.
  * @returns A promise that resolves when the message is successfully added to the chat.
   */
  async addMessageToChat(chatId: string, message: ChatMessage): Promise<void> {
    const chatMessagesCollection = collection(
      this.firestore,
      `chats/${chatId}/chatMessages`
    );
    const messageDoc = doc(chatMessagesCollection); 
    await setDoc(messageDoc, { ...message }); 
  }

  /**
  * Retrieves all chats from the Firestore database.
  * @returns A promise that resolves to an array of chat objects.
  * Each object includes the chat ID and its corresponding data.
  */
  async getChats(): Promise<Chat[]> {
    const chatCollection = collection(this.firestore, 'chats');
    const querySnapshot = await getDocs(chatCollection);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Chat[];
  }
}
