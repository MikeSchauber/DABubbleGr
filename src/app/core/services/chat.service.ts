import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDocs } from '@angular/fire/firestore';
import { Chat, ChatMessage } from '../../models/chat.model.class';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(private firestore: Firestore) {}

  // Chat anlegen
  async createChat(chat: Chat): Promise<void> {
    const chatCollection = collection(this.firestore, 'chats');
    const chatDoc = doc(chatCollection); // Erstelle ein neues Dokument
    await setDoc(chatDoc, { ...chat }); // Speichere den Chat
  }

  // Nachricht in einem Chat anlegen
  async addMessageToChat(chatId: string, message: ChatMessage): Promise<void> {
    const chatMessagesCollection = collection(this.firestore, `chats/${chatId}/chatMessages`);
    const messageDoc = doc(chatMessagesCollection); // Erstelle ein neues Dokument
    await setDoc(messageDoc, { ...message }); // Speichere die Nachricht
  }

  // Alle Chats abrufen
  async getChats(): Promise<Chat[]> {
    const chatCollection = collection(this.firestore, 'chats');
    const querySnapshot = await getDocs(chatCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Chat[];
  }
}
