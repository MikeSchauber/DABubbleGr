import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
  query,
  where,
  collectionData,
  orderBy,
} from '@angular/fire/firestore';
import { IMessage } from '../../models/interfaces/message2interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  constructor(private firestore: Firestore) {}


  
////Anhand der currentChannel Variablenänderung wird ein Fetch getriggert, der die messages collection anhand der currentChannelId filtert
///dieses array aus messages soll dann dem chat bereit gestellt werden (observable). 
///dabei muss die fetch filter funktion auch reaktiv sein und auf änderungen, also neue einträge in der collection mit entsprechender channelID reagieren. 
getMessagesForChannel(channelId: string): Observable<IMessage[]> {
  const messagesCollection = collection(this.firestore, 'messages');
  const channelQuery = query(
    messagesCollection,
    where('channelId', '==', channelId),
    orderBy('timestamp', 'asc') // Sort messages by 'timestamp' in ascending order
  );

  // Use collectionData to get real-time updates
  return collectionData(channelQuery, { idField: 'messageId' }) as Observable<IMessage[]>;
}



async postMessage(channelId: string, senderId: string, content: string): Promise<void> {
  try {
    const messagesCollection = collection(this.firestore, 'messages');
    const messageDocRef = doc(messagesCollection); // Generate a new document reference with ID
    const newMessage = {
      messageId: messageDocRef.id, // Use the generated ID
      channelId: channelId,
      senderId: senderId,
      content: content.trim(), // Trim whitespace from content
      timestamp: serverTimestamp(), // Set timestamp using Firestore
    };

    await setDoc(messageDocRef, newMessage); // Add the message to Firestore
    console.log('Message successfully sent:', newMessage);
  } catch (error) {
    console.error('Error posting message:', error);
    throw error;
  }
}













































  ///Attention the Doc Key Ids are generated randomly each time here!
  async createMessagesCollection(): Promise<void> {
    try {
      const messagesCollection = collection(this.firestore, 'messages'); 
  
      // Step 1: Batch delete all existing messages
      const existingMessagesSnapshot = await getDocs(messagesCollection);
  
      if (!existingMessagesSnapshot.empty) {
        const batch = writeBatch(this.firestore);
  
        existingMessagesSnapshot.forEach((doc) => {
          batch.delete(doc.ref); // Add each message document to the delete batch
        });
  
        await batch.commit(); // Commit the batch delete
        console.log('All existing messages have been deleted.');
      }
  
      // Step 2: Add new messages
      for (const message of this.messages) {
        const messageDocRef = doc(messagesCollection); // Generate a new random document ID
        const messageWithGeneratedId = {
          ...message,
          messageId: messageDocRef.id, // Assign the generated document ID to the messageId field
          // Ensure timestamp is set server-side
        };
  
        await setDoc(messageDocRef, messageWithGeneratedId); // Add the message to Firestore
      }
  
      console.log('Messages collection successfully recreated with new messages.');
    } catch (error) {
      console.error('Error creating messages collection:', error);
    }
  }
  

  //////////////DUMMY DATEN

  messages: IMessage[] = [
    {
      messageId: "msg1",
      senderId: "T12QmXuae7yYywXL0dpc",
      content: "Hello, this is a message in the team channel!",
      timestamp: new Date('2024-11-23T11:15:19Z'),
      channelId: "2MScvzChDXWchtuFsJW9",
      attachments: [
        {
          type: "image",
          url: "https://example.com/image1.png",
        },
      ],
      reactions: [
        {
          emoji: "👍",
          userIds: ["v266QGISMa5W6fvBeBbD", "EwsT2NlbuzUSbCo1NBpI"],
        },
      ],
    },
    {
      messageId: "msg2",
      senderId: "v266QGISMa5W6fvBeBbD",
      content: "I think we should focus on customer feedback this week.",
      timestamp: serverTimestamp(),
      channelId: "2MScvzChDXWchtuFsJW9",
    },
    {
      messageId: "msg3",
      senderId: "EwsT2NlbuzUSbCo1NBpI",
      content: "Good idea! Let me prepare a summary of recent feedback.",
      timestamp: serverTimestamp(),
      channelId: "2MScvzChDXWchtuFsJW9",
      reactions: [
        {
          emoji: "💡",
          userIds: ["T12QmXuae7yYywXL0dpc"],
        },
      ],
    },
  
    // Messages for the "Geschäftsführung" channel
    {
      messageId: "msg4",
      senderId: "Hvk1x9JzzgSEls58gGFc",
      content: "Can we discuss the latest marketing strategies?",
      timestamp: serverTimestamp(),
      channelId: "5KvjC3MbUiNYBrgI1xZn",
      reactions: [
        {
          emoji: "🚀",
          userIds: ["T12QmXuae7yYywXL0dpc", "Hvk1x9JzzgSEls58gGFc"],
        },
      ],
    },
    {
      messageId: "msg5",
      senderId: "Wkk9yqyKuLmPo7lIdXxa",
      content: "I’ve prepared a presentation for our next meeting.",
      timestamp: serverTimestamp(),
      channelId: "5KvjC3MbUiNYBrgI1xZn",
      attachments: [
        {
          type: "file",
          url: "https://example.com/presentation.pptx",
        },
      ],
    },
  
    // Messages for the "Vertriebs Team" channel
    {
      messageId: "msg6",
      senderId: "QGWf2rbPuuwMCip3Ph2A",
      content: "The sales figures are looking great this quarter!",
      timestamp: serverTimestamp(),
      channelId: "FJz45r1mh8K61V2EjIQ0",
      attachments: [
        {
          type: "file",
          url: "https://example.com/report.pdf",
        },
      ],
    },
    {
      messageId: "msg7",
      senderId: "xZZm8TPXkaKZPaDnofVt",
      content: "Let’s aim to close 5 more deals by the end of the month.",
      timestamp: serverTimestamp(),
      channelId: "FJz45r1mh8K61V2EjIQ0",
      reactions: [
        {
          emoji: "🔥",
          userIds: ["T12QmXuae7yYywXL0dpc", "bcQkM31D0UR1qxadZOkU"],
        },
      ],
    },
  
    // Messages for the "Marketing Team" channel
    {
      messageId: "msg8",
      senderId: "pUXpEwRmd5Cmwdg9R4P8",
      content: "Can someone review the new marketing materials?",
      timestamp: new Date('2024-11-27T11:15:19Z'),
      channelId: "ODLmxfQZXd4gexfQ9WBx",
      reactions: [
        {
          emoji: "🎉",
          userIds: ["Wkk9yqyKuLmPo7lIdXxa", "xZZm8TPXkaKZPaDnofVt"],
        },
        {
          emoji: "🔥",
          userIds: ["bcQkM31D0UR1qxadZOkU"],
        },
      ],
    },
    {
      messageId: "msg9",
      senderId: "y3TgOxVJGVRKZMb1fU6Z",
      content: "I’ve uploaded the updated banner designs.",
      timestamp: serverTimestamp(),
      channelId: "ODLmxfQZXd4gexfQ9WBx",
      attachments: [
        {
          type: "image",
          url: "https://example.com/banner.jpg",
        },
      ],
    },
  
    // Messages for the "Team Entwicklung" channel
    {
      messageId: "msg10",
      senderId: "bcQkM31D0UR1qxadZOkU",
      content: "Our development progress is on track!",
      timestamp: serverTimestamp(),
      channelId: "Sce57acZnV7DDXMRydN5",
    },
    {
      messageId: "msg11",
      senderId: "EwsT2NlbuzUSbCo1NBpI",
      content: "The new feature deployment is scheduled for tomorrow.",
      timestamp: serverTimestamp(),
      channelId: "Sce57acZnV7DDXMRydN5",
      reactions: [
        {
          emoji: "👍",
          userIds: ["pUXpEwRmd5Cmwdg9R4P8", "xZZm8TPXkaKZPaDnofVt"],
        },
      ],
    },
    {
      messageId: 'message1',
      channelId: 'Sce57acZnV7DDXMRydN5',
      senderId: 'bcQkM31D0UR1qxadZOkU',
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
          userIds: ['EwsT2NlbuzUSbCo1NBpI', 'Hvk1x9JzzgSEls58gGFc'],
        },
      ],
    },
    {
      messageId: 'message2',
      channelId: 'Sce57acZnV7DDXMRydN5',
      senderId: 'EwsT2NlbuzUSbCo1NBpI',
      content: 'Hey there! Whats up how is it going, the weather is so nice',
      timestamp: new Date('2024-11-13T15:10:00Z'),


      //////////////THREAD MUST BE IMPLEMENTED YET
       //////////////THREAD MUST BE IMPLEMENTED YET
        //////////////THREAD MUST BE IMPLEMENTED YET
         //////////////THREAD MUST BE IMPLEMENTED YET
      threadMessageCount: 3,
      threadId: 'thread26',
      lastThreadMessage: new Date('2024-11-18T02:11:00Z'),
      },
      {
        messageId: 'message3',
        channelId: 'Sce57acZnV7DDXMRydN5',
        senderId: 'Hvk1x9JzzgSEls58gGFc',
        content: 'I´m great, thanks! After five years on the east coast... it was time to go home',
        timestamp: new Date('2024-11-14T15:15:00Z'),
        threadId: 'thread2623623s6',
        threadMessageCount: 2,
        lastThreadMessage: new Date('2024-11-17T00:10:00Z'),
        reactions: [
          {
            emoji: '🚀',
            userIds: ['QGWf2rbPuuwMCip3Ph2A', 'T12QmXuae7yYywXL0dpc', 'Wkk9yqyKuLmPo7lIdXxa'],
          },
          {
            emoji: '🌟',
            userIds: ['bcQkM31D0UR1qxadZOkU'],
          },
        ],
      },
       
  {
    messageId: 'message34',
    channelId: 'Sce57acZnV7DDXMRydN5',
    senderId: 'QGWf2rbPuuwMCip3Ph2A',
    content: 'How are you?',
    timestamp: new Date('2024-11-14T15:15:00Z'),
    
  },
  {
    messageId: 'message43',
    channelId: 'Sce57acZnV7DDXMRydN5',
    senderId: 'Wkk9yqyKuLmPo7lIdXxa',
    content: 'Given that your messages are updated frequently and data changes are dynamic, using pipes is the easiest and most straightforward approach for your situation.',
    timestamp: new Date('2024-11-16T15:15:00Z'),
   
  },
  {
    messageId: "msg10",
    senderId: "bcQkM31D0UR1qxadZOkU",
    content: "Our development progress is on track!",
    timestamp: serverTimestamp(),
    channelId: "2MScvzChDXWchtuFsJW9",
  },
  {
    messageId: "msg11",
    senderId: "EwsT2NlbuzUSbCo1NBpI",
    content: "The new feature deployment is scheduled for tomorrow.",
    timestamp: serverTimestamp(),
    channelId: "2MScvzChDXWchtuFsJW9",
    reactions: [
      {
        emoji: "👍",
        userIds: ["pUXpEwRmd5Cmwdg9R4P8", "xZZm8TPXkaKZPaDnofVt"],
      },
    ],
  },
  {
    messageId: 'message1',
    channelId: '2MScvzChDXWchtuFsJW9',
    senderId: 'bcQkM31D0UR1qxadZOkU',
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
        userIds: ['EwsT2NlbuzUSbCo1NBpI', 'Hvk1x9JzzgSEls58gGFc'],
      },
    ],
  },
  {
    messageId: 'message2',
    channelId: '2MScvzChDXWchtuFsJW9',
    senderId: 'EwsT2NlbuzUSbCo1NBpI',
    content: 'Hey there! Whats up how is it going, the weather is so nice',
    timestamp: new Date('2024-11-13T15:10:00Z'),


    //////////////THREAD MUST BE IMPLEMENTED YET
     //////////////THREAD MUST BE IMPLEMENTED YET
      //////////////THREAD MUST BE IMPLEMENTED YET
       //////////////THREAD MUST BE IMPLEMENTED YET
    threadMessageCount: 3,
    threadId: 'thread26',
    lastThreadMessage: new Date('2024-11-18T02:11:00Z'),
    },
    {
      messageId: 'message3',
      channelId: '2MScvzChDXWchtuFsJW9',
      senderId: 'Hvk1x9JzzgSEls58gGFc',
      content: 'I´m great, thanks! After five years on the east coast... it was time to go home',
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadId: 'thread2623623s6',
      threadMessageCount: 2,
      lastThreadMessage: new Date('2024-11-17T00:10:00Z'),
      reactions: [
        {
          emoji: '🚀',
          userIds: ['QGWf2rbPuuwMCip3Ph2A', 'T12QmXuae7yYywXL0dpc', 'Wkk9yqyKuLmPo7lIdXxa'],
        },
        {
          emoji: '🌟',
          userIds: ['bcQkM31D0UR1qxadZOkU'],
        },
      ],
    },
     
{
  messageId: 'message34',
  channelId: '2MScvzChDXWchtuFsJW9',
  senderId: 'QGWf2rbPuuwMCip3Ph2A',
  content: 'How are you?',
  timestamp: new Date('2024-11-14T15:15:00Z'),
  
},
{
  messageId: 'message43',
  channelId: '2MScvzChDXWchtuFsJW9',
  senderId: 'Wkk9yqyKuLmPo7lIdXxa',
  content: 'Given that your messages are updated frequently and data changes are dynamic, using pipes is the easiest and most straightforward approach for your situation.',
  timestamp: new Date('2024-11-16T15:15:00Z'),
 
},

  ];


  
}

