import { inject, Injectable } from '@angular/core';
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
  getDoc,
  updateDoc 
} from '@angular/fire/firestore';
import { IMessage } from '../../models/interfaces/message2interface';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap } from 'rxjs';
// import { updateDoc } from 'firebase/firestore';
import { UserService } from './user.service';
import { ChannelService } from './channel.service';
import { Message } from '../../models/interfaces/message.interface';
import { Attachment } from '../../models/interfaces/attachment.interface';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  //In services the constructor and variable initialization happens in another order. 
  //When initilize service in constructor, this leads to an error at "channelMessages$ = this.channelService.currentChannelId$.pipe("
  //When injecting the services before with inject() the variables and observables already have the injecteed services when getting initialized. 
  private channelService = inject(ChannelService);
  private userService = inject(UserService);
  private firestore = inject(Firestore);
  
  // constructor(private firestore: Firestore,
  //   private userService: UserService,
  //   private channelService: ChannelService) {}

  // BehaviorSubject to track the currently selected message for thread view
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
  
   // Observable for the selected message with enriched data
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

  // Use collectionData to get real-time updates
  return collectionData(channelQuery, { idField: 'messageId' }) as Observable<IMessage[]>;
}



// async postMessage(channelId: string, senderId: string, content: string): Promise<void> {
//   try {
//     const messagesCollection = collection(this.firestore, 'messages');
//     const messageDocRef = doc(messagesCollection); // Generate a new document reference with ID
//     const newMessage = {
//       messageId: messageDocRef.id, // Use the generated ID
//       channelId: channelId,
//       senderId: senderId,
//       content: content.trim(), // Trim whitespace from content
//       timestamp: serverTimestamp(), // Set timestamp using Firestore
//     };

//     await setDoc(messageDocRef, newMessage); // Add the message to Firestore
//     console.log('Message successfully sent:', newMessage);
//   } catch (error) {
//     console.error('Error posting message:', error);
//     throw error;
//   }
// }
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

  // Fetch the existing reactions for this message
  const messageSnapshot = await getDoc(messageRef);
  if (!messageSnapshot.exists()) {
    console.error(`Message with ID ${messageId} not found.`);
    return;
  }

  const messageData = messageSnapshot.data();
  const reactions = messageData?.['reactions'] || [];

  // Variable to track if the user already reacted to the selected emoji
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
  } else {
    reactions.push({
      emoji: emoji,
      userIds: [currentUserId],
    });
  }

  // Update the reactions array in Firestore
  await updateDoc(messageRef, { reactions });
}







///Edit message

updateMessage(messageId: string, data: Partial<Message>): Promise<void> {
  const messageDocRef = doc(this.firestore, 'messages', messageId); // Get a reference to the specific message
  return updateDoc(messageDocRef, data); // Update the document with the given data
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
        const messageDocRef = doc(messagesCollection, message.messageId); // Generate a new random document ID
        const messageWithGeneratedId = {
          ...message,
          // messageId: messageDocRef.id, // Assign the generated document ID to the messageId field
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
      messageId: "20aHBf6jjiYESKjTasER",
      senderId: "20aHBf6jjiYESKjTY4ER",
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
          userIds: ["20aHBf6jjiYESKjTY4ER", "A5SvMpvvRniMIuh6wpv7"],
        },
      ],
    },
    {
      messageId: "CKVODbbY5HaIYS0QVROl",
      senderId: "A5SvMpvvRniMIuh6wpv7",
      content: "I think we should focus on customer feedback this week.",
      timestamp: serverTimestamp(),
      channelId: "2MScvzChDXWchtuFsJW9",
      threadMessageCount: 1,
    },
    {
      messageId: "CM8RoCanFP38Dp8TjH60",
      senderId: "B78WxLhjM5vFnQP2Nort",
      content: "Good idea! Let me prepare a summary of recent feedback.",
      timestamp: serverTimestamp(),
      channelId: "2MScvzChDXWchtuFsJW9",
      reactions: [
        {
          emoji: "💡",
          userIds: ["B78WxLhjM5vFnQP2Nort"],
        },
      ],
    },
  
    // Messages for the "Geschäftsführung" channel
    {
      messageId: "DrrIgTQPzofKlOaCrvVX",
      senderId: "C89RtYknQ1wFvGH7Jipo",
      content: "Can we discuss the latest marketing strategies?",
      timestamp: serverTimestamp(),
      channelId: "5KvjC3MbUiNYBrgI1xZn",
      reactions: [
        {
          emoji: "🚀",
          userIds: ["C89RtYknQ1wFvGH7Jipo", "D34YrNmoK2wFjLM8Opqr"],
        },
      ],
    },
    {
      messageId: "F1gZH2zChyvKaotMuURo",
      senderId: "D34YrNmoK2wFjLM8Opqr",
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
      messageId: "JnV3X4kA5MNHHsuY1kXm",
      senderId: "VPZyZXcM86RHzYdRCTcC",
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
      messageId: "NWXkSVRIVYuxd5HlzGwN",
      senderId: "cRKbXj0gIDDEjzi8SIzz",
      content: "Let’s aim to close 5 more deals by the end of the month.",
      timestamp: serverTimestamp(),
      channelId: "FJz45r1mh8K61V2EjIQ0",
      reactions: [
        {
          emoji: "🔥",
          userIds: ["VPZyZXcM86RHzYdRCTcC", "cRKbXj0gIDDEjzi8SIzz"],
        },
      ],
    },
  
    // Messages for the "Marketing Team" channel
    {
      messageId: "Qce0OVhiNKp3FJ1GZhWa",
      senderId: "20aHBf6jjiYESKjTY4ER",
      content: "Can someone review the new marketing materials?",
      timestamp: new Date('2024-11-27T11:15:19Z'),
      channelId: "ODLmxfQZXd4gexfQ9WBx",
      reactions: [
        {
          emoji: "🎉",
          userIds: ["20aHBf6jjiYESKjTY4ER", "A5SvMpvvRniMIuh6wpv7"],
        },
        {
          emoji: "🔥",
          userIds: ["B78WxLhjM5vFnQP2Nort"],
        },
      ],
    },
    {
      messageId: "RbJtjOUoQVNMEvfNJwjj",
      senderId: "A5SvMpvvRniMIuh6wpv7",
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
      messageId: "SgKDLC5Ax0dECON6W0An",
      senderId: "bcQkM31D0UR1qxadZOkU",
      content: "Our development progress is on track!",
      timestamp: serverTimestamp(),
      channelId: "Sce57acZnV7DDXMRydN5",
    },
    {
      messageId: "WgFFmtuyFRXW1OskHqWv",
      senderId: "B78WxLhjM5vFnQP2Nort",
      content: "I managed to resolve the encryption in the shower today.",
      timestamp: serverTimestamp(),
      channelId: "Sce57acZnV7DDXMRydN5",
      reactions: [
        {
          emoji: "👍",
          userIds: ["C89RtYknQ1wFvGH7Jipo", "D34YrNmoK2wFjLM8Opqr"],
        },
      ],
    },
    {
      messageId: 'Y7Pbxc9tCjaJO6Vez8jS',
      channelId: 'Sce57acZnV7DDXMRydN5',
      senderId: 'C89RtYknQ1wFvGH7Jipo',
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
          userIds: ['VPZyZXcM86RHzYdRCTcC', 'cRKbXj0gIDDEjzi8SIzz'],
        },
      ],
    },
    {
      messageId: 'bXhHqpCW71KG8heuTJcd',
      channelId: 'Sce57acZnV7DDXMRydN5',
      senderId: 'EwsT2NlbuzUSbCo1NBpI',
      content: 'Hey there! Whats up ?!',
      timestamp: new Date('2024-11-13T15:10:00Z'),
      threadMessageCount: 3,

      
    
      lastThreadMessage: new Date('2024-11-18T02:11:00Z'),
      },
      {
        messageId: 'ki3gOz0HrWM8QXBrGdsB',
        channelId: 'Sce57acZnV7DDXMRydN5',
        senderId: 'D34YrNmoK2wFjLM8Opqr',
        content: 'I´m great, thanks! After five years on the east coast... it was time to go home',
        timestamp: new Date('2024-11-14T15:15:00Z'),
 
        threadMessageCount: 4,
        lastThreadMessage: new Date('2024-11-17T00:10:00Z'),
        reactions: [
          {
            emoji: '🚀',
            userIds: ['20aHBf6jjiYESKjTY4ER', 'A5SvMpvvRniMIuh6wpv7', 'B78WxLhjM5vFnQP2Nort'],
          },
          {
            emoji: '🌟',
            userIds: ['C89RtYknQ1wFvGH7Jipo'],
          },
        ],
      },
       
  {
    messageId: 'mHQmdsXL6en6oCwcVYBo',
    channelId: 'Sce57acZnV7DDXMRydN5',
    senderId: 'VPZyZXcM86RHzYdRCTcC',
    content: 'How are you?',
    timestamp: new Date('2024-11-14T15:15:00Z'),
    
  },
  {
    messageId: 'nL6Udont99U7mVqCxomE',
    channelId: 'Sce57acZnV7DDXMRydN5',
    senderId: 'cRKbXj0gIDDEjzi8SIzz',
    content: 'Given that your messages are updated frequently and data changes are dynamic, using pipes is the easiest and most straightforward approach for your situation.',
    timestamp: new Date('2024-11-16T15:15:00Z'),
   
  },
  {
    messageId: "nmxxhqR868cHNdwC1QkN",
    senderId: "20aHBf6jjiYESKjTY4ER",
    content: "Our development progress is on track!",
    timestamp: serverTimestamp(),
    channelId: "2MScvzChDXWchtuFsJW9",
  },
  {
    messageId: "oTVY4EM3QRwRett1eXCl",
    senderId: "A5SvMpvvRniMIuh6wpv7",
    content: "The new feature deployment is scheduled for tomorrow.",
    timestamp: serverTimestamp(),
    channelId: "2MScvzChDXWchtuFsJW9",
    reactions: [
      {
        emoji: "👍",
        userIds: ["D34YrNmoK2wFjLM8Opqr", "VPZyZXcM86RHzYdRCTcC"],
      },
    ],
  },
  {
    messageId: 'qVSQIFmkNuRKFO3g3V2u',
    channelId: '2MScvzChDXWchtuFsJW9',
    senderId: 'B78WxLhjM5vFnQP2Nort',
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
        userIds: ['cRKbXj0gIDDEjzi8SIzz', '20aHBf6jjiYESKjTY4ER'],
      },
    ],
  },
  {
    messageId: 'sSoLxBt2UCNOxkNh4Tlw',
    channelId: '2MScvzChDXWchtuFsJW9',
    senderId: 'C89RtYknQ1wFvGH7Jipo',
    content: 'I am the testing Mona',
    timestamp: new Date('2024-11-13T15:10:00Z'),

   
    threadId: 'thread26',
    lastThreadMessage: new Date('2024-11-18T02:11:00Z'),
    },
    {
      messageId: 'aaffff55555ggggggg42',
      channelId: '2MScvzChDXWchtuFsJW9',
      senderId: 'D34YrNmoK2wFjLM8Opqr',
      content: 'I´m great, thanks! After five years on the east coast... it was time to go home',
      timestamp: new Date('2024-11-14T15:15:00Z'),

      
      lastThreadMessage: new Date('2024-11-17T00:10:00Z'),
      reactions: [
        {
          emoji: '🚀',
          userIds: ['A5SvMpvvRniMIuh6wpv7', 'B78WxLhjM5vFnQP2Nort', 'C89RtYknQ1wFvGH7Jipo'],
        },
        {
          emoji: '🌟',
          userIds: ['D34YrNmoK2wFjLM8Opqr'],
        },
      ],
    },
     
{
  messageId: '111111ffffffffaaaaa4',
  channelId: '2MScvzChDXWchtuFsJW9',
  senderId: 'VPZyZXcM86RHzYdRCTcC',
  content: 'How are you?',
  timestamp: new Date('2024-11-14T15:15:00Z'),
  
},
{
  messageId: '2222ffffffffffaaaaa1',
  channelId: '2MScvzChDXWchtuFsJW9',
  senderId: 'cRKbXj0gIDDEjzi8SIzz',
  content: 'Given that your messages are updated frequently and data changes are dynamic, using pipes is the easiest and most straightforward approach for your situation.',
  timestamp: new Date('2024-11-16T15:15:00Z'),
 
},
{
  messageId: '2222ffffffffffaaaaa1',
  channelId: 'Sce57acZnV7DDXMRasdf',
  senderId: 'A5SvMpvvRniMIuh6wpv7',
  content: 'Hello Team, welcome to our own Chat App in the style of slack or discord!',
  timestamp: new Date('2024-11-16T15:15:00Z'),
 
},




  ];


  
}

