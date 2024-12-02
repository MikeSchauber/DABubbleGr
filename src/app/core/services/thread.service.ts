import { Injectable } from '@angular/core';
import { Thread } from '../../models/interfaces/thread.interface';
import { IMessage } from '../../models/interfaces/message2interface';
import { collection, doc, Firestore, getDocs, query, serverTimestamp, setDoc, where, writeBatch } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class ThreadService {

  constructor(private firestore: Firestore) { }




  async resetThreadMessages() {
    try {
      const messagesCollection = collection(this.firestore, 'messages');

      // Step 1: Delete all messages with 'threadId' field
      // Firestore doesn't support querying documents where a field exists directly,
      // but we can use a range query to achieve this.

      const querySnapshot = await getDocs(query(messagesCollection, where('threadId', '>=', '')));

      const batchSize = 500; // Firestore batch limit
      let batch = writeBatch(this.firestore);
      let operationCount = 0;

      for (const docSnapshot of querySnapshot.docs) {
        batch.delete(docSnapshot.ref);
        operationCount++;

        if (operationCount === batchSize) {
          await batch.commit();
          batch = writeBatch(this.firestore);
          operationCount = 0;
        }
      }

      // Commit any remaining operations
      if (operationCount > 0) {
        await batch.commit();
      }

      console.log('All messages with threadId have been deleted.');

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
      threadId: 'CKVODbbY5HaIYS0QVROl',

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
      threadId: 'CKVODbbY5HaIYS0QVROl',
     },
    {
      messageId: 'threadmessage3',
      senderId: '"QGWf2rbPuuwMCip3Ph2A',
      content: 'I´m great, thanks! After five years on the east coast... it was time to go home',
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadId: 'CKVODbbY5HaIYS0QVROl',

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
      threadId: 'CKVODbbY5HaIYS0QVROl',
    },
    {
      messageId: 'threadmessage5',

      senderId: 'Wkk9yqyKuLmPo7lIdXxa',
      content: 'Given that your messages are updated frequently and data changes are dynamic, using pipes is the easiest and most straightforward approach for your situation.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'CKVODbbY5HaIYS0QVROl',
    },
  ];
}
