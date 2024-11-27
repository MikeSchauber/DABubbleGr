import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
} from '@angular/fire/firestore';
import { IMessage } from '../../models/interfaces/message2interface';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  constructor(private firestore: Firestore) {}

  

  messages: IMessage[] = [
    {
      messageId: "msg1",
      senderId: "T12QmXuae7yYywXL0dpc",
      content: "Hello, this is a message in the Service channel!",
      timestamp: serverTimestamp(),
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
      timestamp: serverTimestamp(),
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
  ];


  ///Attention the Doc Key Ids are generated randomly each time here!
  async createMessagesCollection(): Promise<void> {
    try {
      const messagesCollection = collection(this.firestore, 'messages'); // Top-level collection
  
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
          timestamp: serverTimestamp(), // Ensure timestamp is set server-side
        };
  
        await setDoc(messageDocRef, messageWithGeneratedId); // Add the message to Firestore
      }
  
      console.log('Messages collection successfully recreated with new messages.');
    } catch (error) {
      console.error('Error creating messages collection:', error);
    }
  }
  



  
}
