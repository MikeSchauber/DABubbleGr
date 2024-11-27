import { Component, EventEmitter, Output } from '@angular/core';
import { DateSeperatorPipe } from './pipes/date-seperator.pipe';
import { GetMessageTimePipe } from './pipes/get-message-time.pipe';
import { ShouldShowDateSeperatorPipe } from './pipes/should-show-date-seperator.pipe';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../../core/services/chat.service';
import { Message } from '../../../models/interfaces/message.interface';
import { Thread } from '../../../models/interfaces/thread.interface';
import { UserService } from '../../../core/services/user.service';
import { ChannelService } from '../../../core/services/channel.service';
import { Observable, Subject, takeUntil} from 'rxjs';
import { Channel } from '../../../models/channel.model.class';

import { serverTimestamp } from 'firebase/firestore';
import { User } from '../../../models/interfaces/user.interface';
// import { User } from '../../../models/user.class';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [DateSeperatorPipe, GetMessageTimePipe, ShouldShowDateSeperatorPipe, CommonModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss', '../../../../styles.scss'],
})

export class ChatComponent {
  private destroy$ = new Subject<void>(); // Emits when the component is destroyed
  currentChannel$: Observable<Channel | null>;
  usersCollectionData$: Observable<User[] |null>;

  messages: Message[]= [];
  currentUserId: string= '';
  currentChannel: any;
  @Output() openThreadBar = new EventEmitter<void>();

  container: any;
  constructor(public chatService: ChatService, 
              public userService: UserService, 
              public channelService: ChannelService) {

    this.currentChannel$ = this.channelService.currentChannel$;
    this.usersCollectionData$ = this.userService.publicUsers$;
  }

  ngOnInit(): void {
    this.messages = this.chatService.messages;
    this.currentUserId = this.userService.currentUserId;
    this.currentChannel = this.channelService.channels[0];

    //  // Subscribe to usersCollectionData$ and log the data
    //  this.usersCollectionData$.subscribe(users => {
    //   console.log('Fetched users:', users);
    // });
    this.userService.publicUsers$
    .pipe(takeUntil(this.destroy$))
    .subscribe(users => {
      console.log('Fetched users:', users);
    });
  }

    
  ngAfterViewInit() {         
    this.container = document.getElementById("chat-content-div-id");           
    this.container.scrollTop = this.container.scrollHeight;  
  }  
  
  onOpenThreadBar(){
    this.openThreadBar.emit();
  }

  ngOnDestroy(): void {
     // Notify the observable to complete and clean up
     this.destroy$.next();
     this.destroy$.complete();
  }

  ///Hilfsfunktion für frontend offline development, voraussichtlich nicht mehr notwendig, wenn die memberIds anhand channel daten gefetcht werden
  get channelMembers(): User[] {
    return this.users.filter((user) =>
      this.currentChannel.memberIds.includes(user.publicUserId)
    );
  }

  ///Dummy Daten für offline Arbeit
  users: User[] = [
    {
      publicUserId: "T12QmXuae7yYywXL0dpc",
      displayName: "Mike Schauber",
      email: "mike.schauber96@gmail.com",
      avatarUrl: "../../../../assets/basic-avatars/avatar1.svg",
      userStatus: "online",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: "v266QGISMa5W6fvBeBbD",
      displayName: "Guest Account",
      email: "guest@gmail.com",
      avatarUrl: "../../../../assets/basic-avatars/avatar2.svg",
      userStatus: "abwesend",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: "",
      displayName: "Sophia Fischer",
      email: "sophia.fischer@example.com",
      avatarUrl: "../../../../assets/basic-avatars/avatar3.svg",
      userStatus: "offline",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: "",
      displayName: "Max Weber",
      email: "max.weber@example.com",
      avatarUrl: "../../../../assets/basic-avatars/avatar4.svg",
      userStatus: "online",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: "",
      displayName: "Lyra Becker",
      email: "lyra.becker@example.com",
      avatarUrl: "../../../../assets/basic-avatars/avatar5.svg",
      userStatus: "abwesend",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: "",
      displayName: "Karl Wagner",
      email: "karl.wagner@example.com",
      avatarUrl: "../../../../assets/basic-avatars/avatar6.svg",
      userStatus: "online",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: "",
      displayName: "Lukas Schulz",
      email: "lukas.schulz@example.com",
      avatarUrl: "../../../../assets/basic-avatars/avatar1.svg",
      userStatus: "offline",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: "",
      displayName: "Anna Hoffmann",
      email: "anna.hoffmann@example.com",
      avatarUrl: "../../../../assets/basic-avatars/avatar2.svg",
      userStatus: "abwesend",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: "",
      displayName: "Astra Schneider",
      email: "astra.schneider@example.com",
      avatarUrl: "../../../../assets/basic-avatars/avatar3.svg",
      userStatus: "online",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: "",
      displayName: "Paul Meyer",
      email: "paul.meyer@example.com",
      avatarUrl: "../../../../assets/basic-avatars/avatar4.svg",
      userStatus: "offline",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  ];

  ////Messages sollte immer überschrieben werden mit dem 
  ////Fetch von einem privaten Chatverlauf ODER einem Channel Chatverlauf
  ///Der Fetch wird getriggered, wenn User auf ein anderes UserProfil klickt für Privat Nachrichten 
  ///...Privatnachricht: messages colelction wird gefiltert anhand conversionId, die eine Kombination aus beiden UserIds und einem "_" ist.
  ///...oder wenn user auf einen Channel drückt - dann wird die message collection anhand von "channelId" gefiltert

  threads: Thread[] = [
    {
      ///thread should look nearly identical to a message object, just without further threads... or ?
      threadId: 'thread1',
      parentMessageId: 'message162',
      channelId: 'channel01',
      createdAt: new Date('2024-11-13T15:05:00Z'),
      createdBy: 'user456',
      attachments: [
        {
          type: 'image',
          url: 'https://example.com/image.png',
        },
      ],
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
    // ...additional threads
  ];

  threadMessages: Message[] = [
    {
      messageId: 'threadmessage1',
      channelId: 'channel01', ///channelId optional
      senderId: 'user123',
      senderName: 'Bob Johnson',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar1.svg',
      content: 'Hello everyone!',
      timestamp: new Date('2024-11-02T09:02:00Z'),
      threadId: 'thread26',
      parentMessageId: 'message2',

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
      messageId: 'threadmessage422',
      channelId: 'channel01',
      senderId: 'user456',
      senderName: 'Alice Wonderland',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar2.svg',
      content: 'Hey there! Whats up how is it going, the weather is so nice',
      timestamp: new Date('2024-11-13T15:10:00Z'),
      threadId: 'thread26',
      parentMessageId: 'message2',
     },
    {
      messageId: 'threadmessage3515',
      channelId: 'channel01',
      senderId: 'user123',
      senderName: 'Michael Jordan',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar3.svg',
      content: 'I´m great, thanks! After five years on the east coast... it was time to go home',
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadId: 'thread26',
      parentMessageId: 'message2',
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
      messageId: 'threadmessage34111',
      channelId: 'channel01',
      senderId: 'user1234',
      senderName: 'Daniel Jackson',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar4.svg',
      content: 'How are you?',
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadId: 'thread2623623s6',
      parentMessageId: 'message3',
    },
    {
      messageId: 'message43999',
      channelId: 'channel01',
      senderId: 'user1234',
      senderName: 'Daniel Jackson',
      senderAvatarUrl: '../../../../assets/basic-avatars/avatar4.svg',
      content: 'Given that your messages are updated frequently and data changes are dynamic, using pipes is the easiest and most straightforward approach for your situation.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'thread2623623s6',
      parentMessageId: 'message2',
    },
  ];

  populateDummyChannels() {
    this.channelService.addDummyChannels()
      .then(() => {
        console.log('Dummy channels have been added.');
      })
      .catch((error) => {
        console.error('Error adding dummy channels:', error);
      });
  }

populateDummyChannelsWithDummyMembers(){
  this.channelService.populateChannelsWithMembers();
}
   
resetPublicUserData(){
  this.channelService.resetPublicUserData();
}


async clonePublicUserDataCollection() {
  try {
    await this.channelService.clonePublicUserDataCollection();
    console.log('Cloning of publicUserData collection completed.');
  } catch (error) {
    console.error('Error during cloning publicUserData collection:', error);
  }
}

  // //first try of adding and removing reactions
  // addReaction(message: Message, emoji: string) {
  //   if (message.senderId === this.currentUserId) {
  //     // Prevent self-reactions
  //     return;
  //   }

  //   const userHasReacted = Object.keys(message.reactions || {}).some(e =>
  //     (message.reactions[e] || []).includes(this.currentUserId)
  //   );

  //   if (userHasReacted) {
  //     // User wants to change their reaction
  //     this.changeReaction(message, emoji);
  //   } else {
  //     // User is adding a new reaction
  //     const messageRef = this.firestore.collection('messages').doc(message.messageId);
  //     messageRef.update({
  //       [`reactions.${emoji}`]: firebase.firestore.FieldValue.arrayUnion(this.currentUserId)
  //     });
  //   }
  // }

  // changeReaction(message: Message, newEmoji: string) {
  //   // Remove user from old reaction
  //   for (const [emoji, userIds] of Object.entries(message.reactions || {})) {
  //     if (userIds.includes(this.currentUserId)) {
  //       const messageRef = this.firestore.collection('messages').doc(message.messageId);
  //       messageRef.update({
  //         [`reactions.${emoji}`]: firebase.firestore.FieldValue.arrayRemove(this.currentUserId)
  //       });
  //       break;
  //     }
  //   }
  //   // Add user to new reaction
  //   this.addReaction(message, newEmoji);
  // }
}

// //First example of Updating the messages in realtime: Attention no unsubscribe here
// this.messageService.getMessages().subscribe((newMessages) => {
//   this.messages = newMessages;
//   this.processMessages();
// });

// Access messages collection, filter by channelId and get a sorted array of the latest 50 messages inside the channel:
// Firestore query to get messages for a specific channel
// this.firestore
//   .collection<Message>('messages', ref =>
//     ref
//       .where('channelId', '==', this.currentChannel.channelId)
//       .orderBy('timestamp', 'desc')
//       .limit(50) // Fetch the latest 50 messages
//   )
//   .valueChanges({ idField: 'messageId' })
//   .subscribe(messages => {
//     // Since we're ordering by timestamp descending, we might want to reverse the array
//     this.currentChannelMessages = messages.reverse();
//   });

//Für Antworten zu messages (threads):
// Function to create a new thread
// createThread(parentMessageId: string) {
//   const threadId = this.firestore.createId();
//   const thread: Thread = {
//     threadId,
//     parentMessageId,
//     channelId: this.currentChannel.channelId,
//     createdAt: new Date(),
//     createdBy: this.authService.currentUser.userId,
//   };
//   this.firestore.collection('threads').doc(threadId).set(thread);
//   return threadId;
// }

///Message sending in einem thread:
// sendMessageInThread(content: string, threadId: string) {
//   const currentUser = this.authService.currentUser;
//   const message: Message = {
//     messageId: this.firestore.createId(),
//     channelId: this.currentChannel.channelId,
//     senderId: currentUser.userId,
//     senderName: currentUser.displayName,
//     senderAvatarUrl: currentUser.avatarUrl,
//     content,
//     timestamp: new Date(),
//     threadId,
//   };
//   this.firestore.collection('messages').doc(message.messageId).set(message);
// }

//mögliche firebase abfrage:
// loadThreadMessages(threadId: string) {
//   this.firestore
//     .collection<Message>('messages', ref =>
//       ref.where('threadId', '==', threadId).orderBy('timestamp', 'asc')
//     )
//     .valueChanges({ idField: 'messageId' })
//     .subscribe(threadMessages => {
//       this.currentThreadMessages = threadMessages;
//     });
// }

//Beispiel für Sec Rules für thread Zugriff:
// match /messages/{messageId} {
//   allow read, write: if isChannelMember(request.auth.uid, resource.data.channelId);
// }

// match /threads/{threadId} {
//   allow read, write: if isChannelMember(request.auth.uid, resource.data.channelId);
// }

// function isChannelMember(userId, channelId) {
//   return exists(/databases/$(database)/documents/channels/$(channelId)) &&
//          get(/databases/$(database)/documents/channels/$(channelId)).data.memberIds.hasAny([userId]);
// }

///Kreiiere einen thread wenn noch keiner vorhanden:
// startThread(parentMessageId: string, content: string) {
//   // Check if thread already exists
//   const parentMessageRef = this.firestore.collection('messages').doc(parentMessageId);
//   parentMessageRef.get().subscribe(doc => {
//     let threadId = doc.data().threadId;
//     if (!threadId) {
//       // Create a new thread
//       threadId = this.createThread(parentMessageId);
//       // Update the parent message to include the threadId
//       parentMessageRef.update({ threadId });
//     }
//     // Send the first message in the thread
//     this.sendMessageInThread(content, threadId);
//   });
// }
