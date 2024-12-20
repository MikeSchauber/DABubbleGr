import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  collectionData,
  orderBy,
  getDoc,
  updateDoc 
} from '@angular/fire/firestore';
import { IMessage } from '../../models/interfaces/message2interface';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { UserService } from './user.service';
import { ChannelService } from './channel.service';
import { Message } from '../../models/interfaces/message.interface';
import { Attachment } from '../../models/interfaces/attachment.interface';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  //In services the constructor and variable initialization happens in another order, therefore injecting other services is better than calling them in the constructor. 

  private channelService = inject(ChannelService);
  private userService = inject(UserService);
  private firestore = inject(Firestore);
  
  private selectedMessageSubject = new BehaviorSubject<string | null>(null);
  selectedMessageId$ = this.selectedMessageSubject.asObservable();

  channelMessages$ = this.channelService.currentChannelId$.pipe(
    switchMap(channelId => {
      if (!channelId) return of([]); // Use of([]) for consistency
      return this.getMessagesForChannel(channelId);
    }),
    switchMap(messages => 
      combineLatest([
        of(messages),
        this.userService.getUserMap$()
      ]).pipe(
        map(([messages, userMap]) => 
          messages.map(message => this.enrichMessage(message, userMap))
        )
      )
    )
  );
  
   selectedMessage$ = combineLatest([
    this.selectedMessageId$,
    this.channelMessages$
  ]).pipe(
    map(([selectedId, messages]) => {
      if (!selectedId || !messages) return null;
      // Find the selected message from our existing messages data
      return messages.find(message => message.messageId === selectedId) || null;
    })
  );


        
  private enrichMessage(message: IMessage, userMap: Map<string, any>): IMessage & {
    senderName: string;
    senderAvatarUrl: string;
    enrichedReactions: Array<{
      emoji: string;
      users: string[];
      userIds: string[];
    }>;
  } {
    return {
      ...message,
      senderName: userMap.get(message.senderId)?.displayName || 'Unknown User',
      senderAvatarUrl: userMap.get(message.senderId)?.avatarUrl || 'default-avatar-url',
      enrichedReactions: message.reactions?.map(reaction => ({
        ...reaction,
        users: reaction.userIds.map(
          userId => userMap.get(userId)?.displayName || 'Unknown User'
        ),
      })) || [],
    };
  }

  // Method to set the selected message for thread view
  setSelectedMessage(messageId: string) {
    this.selectedMessageSubject.next(messageId);
    // console.log("messages service: this.selectedMessageSubject.next(messageId): message id:" ,messageId );
  }


  

getMessagesForChannel(channelId: string): Observable<IMessage[]> {
  const messagesCollection = collection(this.firestore, 'messages');
  const channelQuery = query(
    messagesCollection,
    where('channelId', '==', channelId),
    orderBy('timestamp', 'asc') // Sort messages by 'timestamp' in ascending order
  );
  return collectionData(channelQuery, { idField: 'messageId' }) as Observable<IMessage[]>;
}

async postMessage(
  channelId: string, 
  senderId: string, 
  messageData: { content: string; attachments?: Attachment[] }
): Promise<void> {
  try {
    const messagesCollection = collection(this.firestore, 'messages');
    const messageDocRef = doc(messagesCollection);
    const newMessage = {
      messageId: messageDocRef.id,
      channelId: channelId,
      senderId: senderId,
      content: messageData.content,
      attachments: messageData.attachments,
      timestamp: serverTimestamp(),
    };
    await setDoc(messageDocRef, newMessage);
    console.log('Message successfully sent:', newMessage);
  } catch (error) {
    console.error('Error posting message:', error);
    throw error;
  }
}

async addReactionToMessage(messageId: string, emoji: string, currentUserId: string) {
  const messageRef = doc(this.firestore, 'messages', messageId);
  const messageSnapshot = await getDoc(messageRef);
  if (!messageSnapshot.exists()) {
    console.error(`Message with ID ${messageId} not found.`);
    return;
  }
  const messageData = messageSnapshot.data();
  const reactions = messageData?.['reactions'] || [];
  let isUserReactionRemoved = false;

  // Step 1: Remove the userId from the selected emoji if it exists
  for (let i = reactions.length - 1; i >= 0; i--) {
    const reaction = reactions[i];
    if (reaction.emoji === emoji) {
      const userIndex = reaction.userIds.indexOf(currentUserId);
      if (userIndex > -1) {
        // Remove the userId from this emoji's userIds array
        reaction.userIds.splice(userIndex, 1);
        // If the userIds array is now empty, remove the entire emoji
        if (reaction.userIds.length === 0) {
          reactions.splice(i, 1);
        }
        isUserReactionRemoved = true;
        break;
      }
    }
  }
  // Step 2: If the user reaction for the selected emoji was removed, no need to proceed
  if (isUserReactionRemoved) {
    await updateDoc(messageRef, { reactions });
    return;
  }
  // Step 3: Remove the userId from other emojis if the user has reacted to them
  for (let i = reactions.length - 1; i >= 0; i--) {
    const reaction = reactions[i];
    if (reaction.emoji !== emoji) {
      const userIndex = reaction.userIds.indexOf(currentUserId);
      if (userIndex > -1) {
        // Remove the userId from this emoji's userIds array
        reaction.userIds.splice(userIndex, 1);
        // If the userIds array is now empty, remove the entire emoji
        if (reaction.userIds.length === 0) {
          reactions.splice(i, 1);
        }
      }
    }
  }
  // Step 4: Add the userId to the selected emoji or create a new emoji entry
  const selectedReaction = reactions.find((reaction: any) => reaction.emoji === emoji);
  if (selectedReaction) {
    selectedReaction.userIds.push(currentUserId);
  } else {reactions.push({
      emoji: emoji,
      userIds: [currentUserId],
    });
  }
  await updateDoc(messageRef, { reactions });
}


///Edit message
updateMessage(messageId: string, data: Partial<Message>): Promise<void> {
  const messageDocRef = doc(this.firestore, 'messages', messageId); // Get a reference to the specific message
  return updateDoc(messageDocRef, data); // Update the document with the given data
}




























  
}

