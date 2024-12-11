import { Injectable } from '@angular/core';
import { Thread } from '../../models/interfaces/thread.interface';
import { IMessage } from '../../models/interfaces/message2interface';
import { collection, collectionData, doc, Firestore, getDocs, increment, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, of, shareReplay, switchMap, take, tap } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ThreadService {

  private currentThreadIdSubject = new BehaviorSubject<string | null>(null);
  currentThreadId$ = this.currentThreadIdSubject.asObservable();

  threadMessages$: Observable<IMessage[]>;

  constructor(private firestore: Firestore) { 

    this.threadMessages$ = this.currentThreadId$.pipe(
      switchMap((threadId) => {
        if (threadId) {
          return this.getMessagesForThread(threadId).pipe(
            tap((messages) => console.log('Messages fetched for thread:', messages)),
            shareReplay(1) // Move shareReplay here
          );
        } else {
          return of([]);
        }
      })
    );
  
    
  }


 setCurrentThread(threadId: string) {
    this.currentThreadIdSubject.next(threadId);
    console.log('Current thread ID set to: ', this.currentThreadIdSubject.value);
    // this.getMessagesForThread(threadId);
  }


  getMessagesForThread(messageId: string): Observable<IMessage[]> {
    const messagesCollection = collection(this.firestore, 'messages');
    const threadQuery = query(
      messagesCollection,
      where('threadId', '==', messageId),
      orderBy('timestamp', 'asc')
    );

    // console.log('Fetching messages for threadId:', messageId);

    return collectionData(threadQuery) as Observable<IMessage[]>;
  }





async postThreadMessage(threadId: string, senderId: string, content: string): Promise<void> {
  try {
    const messagesCollection = collection(this.firestore, 'messages');
    const messageDocRef = doc(messagesCollection);
    const newMessage = {
      messageId: messageDocRef.id,
      threadId: threadId,
      senderId: senderId,
      content: content.trim(),
      timestamp: serverTimestamp(),
    };

    // First post the new message
    await setDoc(messageDocRef, newMessage);
    
    // Then update the parent message's thread info
    await this.updateParentMessageThreadInfo(threadId, 1);
    
    // console.log('Thread message sent and parent updated');
  } catch (error) {
    console.error('Error in thread message operation:', error);
    throw error;
  }
}

async updateParentMessageThreadInfo(parentMessageId: string, incrementValue: number) {
  try {
    const parentMessageRef = doc(this.firestore, 'messages', parentMessageId);
    await updateDoc(parentMessageRef, {
      threadMessageCount: increment(incrementValue),
      lastThreadMessage: new Date(),
    });
  } catch (error) {
    console.error('Error updating parent message thread info:', error);
    throw error;
  }
}


























  async createThreadMessages() {
    try {
      const messagesCollection = collection(this.firestore, 'messages');

      for (const thread of this.threadMessages) {
        const threadDocRef = doc(messagesCollection, thread.messageId); // Use setDoc with specific ID
  
        await setDoc(threadDocRef, {
          ...thread
        });
      }
  

      console.log('Thread messages have been added to the messages collection.');
    } catch (error) {
      console.error('Error resetting thread messages:', error);
    }
  }


///THREADID entspricht der parentMessageId ! somit braucht man auch das Feld "parentmessage" in der thread message gar nicht. 
  threadMessages: IMessage[] = [
    {
      messageId: 'threadmessage1',
      senderId: '20aHBf6jjiYESKjTY4ER',
      content: 'Hello everyone!',
      timestamp: new Date('2024-11-02T09:02:00Z'),
      threadId: 'ki3gOz0HrWM8QXBrGdsB',

      attachments: [
        {
          type: 'image',
          url: 'https://example.com/image.png',
        },
      ],
      reactions: [
        {
          emoji: '👍',
          userIds: ['D34YrNmoK2wFjLM8Opqr', 'C89RtYknQ1wFvGH7Jipo'],
        },
      ],
    },
    {
      messageId: 'threadmessage2',
      senderId: 'A5SvMpvvRniMIuh6wpv7',
      content: 'Hey there! Whats up how is it going, the weather is so nice',
      timestamp: new Date('2024-11-13T15:10:00Z'),
      threadId: 'ki3gOz0HrWM8QXBrGdsB',
     },
    {
      messageId: 'threadmessage3',
      senderId: 'B78WxLhjM5vFnQP2Nort',
      content: 'I´m great, thanks! After five years on the east coast... it was time to go home',
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadId: 'ki3gOz0HrWM8QXBrGdsB',

      reactions: [
        {
          emoji: '🚀',
          userIds: ['B78WxLhjM5vFnQP2Nort', 'A5SvMpvvRniMIuh6wpv7', '20aHBf6jjiYESKjTY4ER'],
        },
        {
          emoji: '🌟',
          userIds: ['cRKbXj0gIDDEjzi8SIzz'],
        },
      ],
    },
    {
      messageId: 'threadmessage4',

      senderId: 'C89RtYknQ1wFvGH7Jipo',
      content: 'How are you?',
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadId: 'ki3gOz0HrWM8QXBrGdsB',
    },
    {
      messageId: 'threadmessage5',

      senderId: 'D34YrNmoK2wFjLM8Opqr',
      content: 'Hmm customers ... yes.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'CKVODbbY5HaIYS0QVROl',
    },
    {
      messageId: 'threadmessage6',

      senderId: 'VPZyZXcM86RHzYdRCTcC',
      content: 'I am doing the testing yes.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'bXhHqpCW71KG8heuTJcd',
      reactions: [
        {
          emoji: '🚀',
          userIds: ['VPZyZXcM86RHzYdRCTcC', 'D34YrNmoK2wFjLM8Opqr', 'C89RtYknQ1wFvGH7Jipo'],
        },
        {
          emoji: '🌟',
          userIds: ['B78WxLhjM5vFnQP2Nort'],
        },
      ],
    },
    {
      messageId: 'threadmessage7',

      senderId: 'VPZyZXcM86RHzYdRCTcC',
      content: 'Not again...',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'bXhHqpCW71KG8heuTJcd',
    },
    {
      messageId: 'threadmessage8',
      senderId: 'cRKbXj0gIDDEjzi8SIzz',
      content: 'Ou yea.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'bXhHqpCW71KG8heuTJcd',
    },
    {
      messageId: 'threadmessage8',
      senderId: 'cRKbXj0gIDDEjzi8SIzz',
      content: 'Ou yea.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'bXhHqpCW71KG8heuTJcd',
    },
    
  ];
}


