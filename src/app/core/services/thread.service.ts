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

  constructor(private firestore: Firestore) { 


    
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



  // threadMessages$ = this.currentThreadId$.pipe(
  //   switchMap((threadId) => {
  //     if (threadId) {
  //       // console.log('Switching to threadId:', threadId);
  //       return this.getMessagesForThread(threadId).pipe(
  //         tap((messages) => 
            
  //           console.log('Messages fetched for thread:', messages)
        
  //       )
  //       );
  //     } else {
  //       return of([]);
  //     }
  //   }),
  //   shareReplay(1) 
  // );
  threadMessages$ = this.currentThreadId$.pipe(
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



// async deleteThreadMessage(messageId: string, threadId: string): Promise<void> {
//   try {
//     const messageRef = doc(this.firestore, 'messages', messageId);
//     await deleteDoc(messageRef);
    
//     // Then update the parent message's thread info
//     await this.updateParentMessageThreadInfo(threadId, -1);
    
//     console.log('Thread message deleted and parent updated');
//   } catch (error) {
//     console.error('Error deleting thread message:', error);
//     throw error;
//   }
// }





// Security rules for deleting messages in thread:
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /messages/{messageId} {
//       allow read: if true;
//       allow create: if request.auth.uid != null;
//       allow update: if request.auth.uid == resource.data.senderId
//         && !('threadMessageCount' in request.resource.data);
//       allow delete: if request.auth.uid == resource.data.senderId;
//     }
//   }
// }




















































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
      senderId: 'EwsT2NlbuzUSbCo1NBpI',
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
          userIds: ['y3TgOxVJGVRKZMb1fU6Z', 'xZZm8TPXkaKZPaDnofVt'],
        },
      ],
    },
    {
      messageId: 'threadmessage2',
      senderId: 'Hvk1x9JzzgSEls58gGFc',
      content: 'Hey there! Whats up how is it going, the weather is so nice',
      timestamp: new Date('2024-11-13T15:10:00Z'),
      threadId: 'ki3gOz0HrWM8QXBrGdsB',
     },
    {
      messageId: 'threadmessage3',
      senderId: 'QGWf2rbPuuwMCip3Ph2A',
      content: 'I´m great, thanks! After five years on the east coast... it was time to go home',
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadId: 'ki3gOz0HrWM8QXBrGdsB',

      reactions: [
        {
          emoji: '🚀',
          userIds: ['v266QGISMa5W6fvBeBbD', 'pUXpEwRmd5Cmwdg9R4P8', 'bcQkM31D0UR1qxadZOkU'],
        },
        {
          emoji: '🌟',
          userIds: ['Wkk9yqyKuLmPo7lIdXxa'],
        },
      ],
    },
    {
      messageId: 'threadmessage4',

      senderId: 'T12QmXuae7yYywXL0dpc',
      content: 'How are you?',
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadId: 'ki3gOz0HrWM8QXBrGdsB',
    },
    {
      messageId: 'threadmessage5',

      senderId: 'Wkk9yqyKuLmPo7lIdXxa',
      content: 'Testing yes.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'CKVODbbY5HaIYS0QVROl',
    },
    {
      messageId: 'threadmessage6',

      senderId: 'Wkk9yqyKuLmPo7lIdXxa',
      content: 'I am doing the testing yes.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'bXhHqpCW71KG8heuTJcd',
      reactions: [
        {
          emoji: '🚀',
          userIds: ['v266QGISMa5W6fvBeBbD', 'pUXpEwRmd5Cmwdg9R4P8', 'bcQkM31D0UR1qxadZOkU'],
        },
        {
          emoji: '🌟',
          userIds: ['Wkk9yqyKuLmPo7lIdXxa'],
        },
      ],
    },
    {
      messageId: 'threadmessage7',

      senderId: 'Wkk9yqyKuLmPo7lIdXxa',
      content: 'Not again...',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'bXhHqpCW71KG8heuTJcd',
    },
    {
      messageId: 'threadmessage8',
      senderId: 'Wkk9yqyKuLmPo7lIdXxa',
      content: 'Ou yea.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'bXhHqpCW71KG8heuTJcd',
    },
    {
      messageId: 'threadmessage8',
      senderId: 'Wkk9yqyKuLmPo7lIdXxa',
      content: 'Ou yea.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'bXhHqpCW71KG8heuTJcd',
    },
    
  ];
}


