import { userImages } from '../../../assets/base64images/userDummyImages';
import { inject, Injectable } from '@angular/core';
import { User } from '../../models/interfaces/user.interface';
import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { IMessage } from '../../models/interfaces/message2interface';

@Injectable({
  providedIn: 'root',
})
export class DummyDataService {
  private firestore = inject(Firestore);

  constructor() {}

  async addDummyChannels() {
    try {
      const channelsCollection = collection(this.firestore, 'channels');
      const querySnapshot = await getDocs(channelsCollection);

      const batchSize = 500; 
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

      if (operationCount > 0) {
        await batch.commit();
      }

      console.log('All existing channels have been deleted.');

      for (const channelData of this.dummyChannels) {
        const userDocRef = doc(channelsCollection, channelData.channelId);

        await setDoc(userDocRef, {
          channelId: channelData.channelId,
          name: channelData.name,
          description: channelData.description,
          createdBy: 'currentUser',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          memberIds: [],
        });
      }
      console.log('Dummy channels have been added.');
    } catch (error) {
      console.error('Error in addDummyChannels:', error);
    }
  }

  async populateChannelsWithMembers() {
    try {
      const publicUserDataCollection = collection(
        this.firestore,
        'publicUserData'
      );
      const publicUsersSnapshot = await getDocs(publicUserDataCollection);

      // Extract publicUserIds from the fetched data
      const publicUserIds = publicUsersSnapshot.docs.map((doc) => doc.id);

      if (publicUserIds.length === 0) {
        console.warn('No public users found in publicUserData collection.');
        return;
      }

      const channelsCollection = collection(this.firestore, 'channels');
      const channelsSnapshot = await getDocs(channelsCollection);

      const batchSize = 500; // Firestore batch limit
      let batch = writeBatch(this.firestore);
      let operationCount = 0;

      for (const channelDoc of channelsSnapshot.docs) {
        const channelData = channelDoc.data();
        const channelRef = channelDoc.ref;

        // Skip channels of type "private"
        if (channelData['type'] === 'private') {
          continue;
        }

        if (channelData['name'] === 'Welcome Team!') {
          // Assign all publicUserIds to the "Welcome Team!" channel
          batch.update(channelRef, { memberIds: publicUserIds });
          operationCount++;
          continue;
        }

        // Randomly assign members to other non-private channels
        const numMembers = Math.floor(Math.random() * 7);
        const shuffledUserIds = this.shuffleArray([...publicUserIds]);
        const selectedMemberIds = shuffledUserIds.slice(0, numMembers);

        batch.update(channelRef, { memberIds: selectedMemberIds });
        operationCount++;

        // Commit the batch if it reaches the batch size limit
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

      console.log('Channels have been populated with members.');
    } catch (error) {
      console.error('Error populating channels with members:', error);
    }
  }

  /**
   * Helper function to shuffle an array
   */
  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async resetPublicUserData() {
    try {
      const publicUserDataCollection = collection(
        this.firestore,
        'publicUserData'
      );

      // Step 1: Delete all existing documents in the collection
      const querySnapshot = await getDocs(publicUserDataCollection);

      for (const doc of querySnapshot.docs) {
        await deleteDoc(doc.ref);
        console.log(`Deleted document with ID: ${doc.id}`);
      }
      console.log(
        'All existing documents in publicUserDataClone collection have been deleted.'
      );

      // Step 2: Add users from the `users` array with their `publicUserId` as the document ID
      for (const user of this.users) {
        const userDocRef = doc(publicUserDataCollection, user.publicUserId); // Use setDoc with specific ID

        await setDoc(userDocRef, {
          displayName: user.displayName,
          accountEmail: user.accountEmail,
          displayEmail: user.displayEmail,
          avatarUrl: user.avatarUrl,
          userStatus: user.userStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          publicUserId: user.publicUserId,
        });

        console.log(
          `User ${user.displayName} added with ID: ${user.publicUserId}`
        );
      }

      console.log(
        'All users have been repopulated in the publicUserDataClone collection with correct document IDs.'
      );
    } catch (error) {
      console.error('Error resetting publicUserDataClone:', error);
    }
  }

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

        await batch.commit();
        console.log('All existing messages have been deleted.');
      }

      // Step 2: Add new messages
      for (const message of this.messages) {
        const messageDocRef = doc(messagesCollection, message.messageId); // Generate a new random document ID
        const messageWithGeneratedId = {
          ...message,
        };

        await setDoc(messageDocRef, messageWithGeneratedId); // Add the message to Firestore
      }

      console.log(
        'Messages collection successfully recreated with new messages.'
      );
    } catch (error) {
      console.error('Error creating messages collection:', error);
    }
  }

  async createThreadMessages() {
    try {
      const messagesCollection = collection(this.firestore, 'messages');

      for (const thread of this.threadMessages) {
        const threadDocRef = doc(messagesCollection, thread.messageId);

        await setDoc(threadDocRef, {
          ...thread,
        });
      }

      console.log(
        'Thread messages have been added to the messages collection.'
      );
    } catch (error) {
      console.error('Error resetting thread messages:', error);
    }
  }


  //Dummy Data//
  users: User[] = [
    {
      publicUserId: 'DWFo4OWNuAxJ7IAlqLEl',
      displayName: 'Mike Schauber',
      accountEmail: 'mike.schauber96@gmail.com',
      displayEmail: 'mike.schauber96@gmail.com',
      avatarUrl: userImages.avatar06,
      userStatus: 'online',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: 'A5SvMpvvRniMIuh6wpv7',
      displayName: 'Guest Account',
      accountEmail: 'guest@gmail.com',
      displayEmail: 'guest@gmail.com',
      avatarUrl: 'assets/basic-avatars/avatar4.svg',
      userStatus: 'away',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: 'TLYFvhadjakBvpVgtxvl',
      displayName: 'Roman Kabucov',
      accountEmail: 'roman@testing.de',
      displayEmail: 'roman@testing.de',
      avatarUrl: userImages.avatar01,
      userStatus: 'online',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: 'C89RtYknQ1wFvGH7Jipo',
      displayName: 'Sir Debugé',
      accountEmail: 'fixitfast@knights.com',
      displayEmail: 'fixitfast@knights.com',
      avatarUrl: '../../../../assets/basic-avatars/avatar4.svg',
      userStatus: 'online',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: 'B78WxLhjM5vFnQP2Nort',
      displayName: 'Alan Turing',
      accountEmail: 'frontendwizard@syntax.me',
      displayEmail: 'frontendwizard@syntax.me',
      avatarUrl: userImages.avatar02,
      userStatus: 'away',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: 'D34YrNmoK2wFjLM8Opqr',
      displayName: 'Captain Hook',
      accountEmail: 'codethief@pirates.dev',
      displayEmail: 'codethief@pirates.dev',
      avatarUrl: userImages.avatar03,
      userStatus: 'offline',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: 'C89RtYknQ1wFvGH7Jipo',
      displayName: 'Mona Lisa',
      accountEmail: 'lona@misa.com',
      displayEmail: 'lisa@moona.com',
      avatarUrl: userImages.avatar04,
      userStatus: 'online',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: '20aHBf6jjiYESKjTY4ER',
      displayName: 'Sophia Fischer',
      accountEmail: 'sophie@fischer.com',
      displayEmail: 'sophie@fischer.com',
      avatarUrl: 'assets/basic-avatars/avatar2.svg',
      userStatus: 'online',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      publicUserId: '0IBkc05KwFZ6URDgZ28v',
      displayName: 'Caro Willers',
      accountEmail: 'carowillers@gmail.com',
      displayEmail: 'carowillers@gmail.com',
      avatarUrl: userImages.avatar05,
      userStatus: 'online',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  ];

  dummyChannels = [
    {
      channelId: 'Sce57acZnV7DDXMRasdf',
      name: 'Welcome Team!',
      description: 'Ein Kanal für alle neuen Mitglieder!',
      createdBy: 'currentUser',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      memberIds: [],
    },
    {
      channelId: 'Sce57acZnV7DDXMRydN5',
      name: 'Service',
      description: 'Verbesserungsvorschläge',
      createdBy: 'currentUser',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      memberIds: [],
    },
    {
      channelId: '5KvjC3MbUiNYBrgI1xZn',
      name: 'Geschäftsführung',
      description: 'Discuss marketing strategies and campaigns',
      createdBy: 'currentUser',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      memberIds: [],
    },
    {
      channelId: 'FJz45r1mh8K61V2EjIQ0',
      name: 'Vertriebs Team',
      description: 'Sales team discussions and updates',
      createdBy: 'currentUser',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      memberIds: [],
    },
    {
      channelId: 'ODLmxfQZXd4gexfQ9WBx',
      name: 'Marketing Team',
      description: 'Customer support and issue tracking',
      createdBy: 'currentUser',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      memberIds: [],
    },
    {
      channelId: '2MScvzChDXWchtuFsJW9',
      name: 'Team Entwicklung',
      description: 'Human resources discussions',
      createdBy: 'currentUser',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      memberIds: [],
    },
  ];

  messages: IMessage[] = [
    {
      messageId: '20aHBf6jjiYESKjTasER',
      senderId: '20aHBf6jjiYESKjTY4ER',
      content: 'Hello, this is a message in the team channel!',
      timestamp: new Date('2024-11-23T11:15:19Z'),
      channelId: '2MScvzChDXWchtuFsJW9',
      reactions: [
        {
          emoji: '👍',
          userIds: ['20aHBf6jjiYESKjTY4ER', 'A5SvMpvvRniMIuh6wpv7'],
        },
      ],
    },
    {
      messageId: 'CKVODbbY5HaIYS0QVROl',
      senderId: 'A5SvMpvvRniMIuh6wpv7',
      content: 'I think we should focus on customer feedback this week.',
      timestamp: serverTimestamp(),
      channelId: '2MScvzChDXWchtuFsJW9',
      threadMessageCount: 1,
    },
    {
      messageId: 'CM8RoCanFP38Dp8TjH60',
      senderId: 'B78WxLhjM5vFnQP2Nort',
      content: 'Good idea! Let me prepare a summary of recent feedback.',
      timestamp: serverTimestamp(),
      channelId: '2MScvzChDXWchtuFsJW9',
      reactions: [
        {
          emoji: '💡',
          userIds: ['B78WxLhjM5vFnQP2Nort'],
        },
      ],
    },
    {
      messageId: 'DrrIgTQPzofKlOaCrvVX',
      senderId: 'C89RtYknQ1wFvGH7Jipo',
      content: 'Can we discuss the latest marketing strategies?',
      timestamp: serverTimestamp(),
      channelId: '5KvjC3MbUiNYBrgI1xZn',
      reactions: [
        {
          emoji: '🚀',
          userIds: ['C89RtYknQ1wFvGH7Jipo', 'D34YrNmoK2wFjLM8Opqr'],
        },
      ],
    },
    {
      messageId: 'F1gZH2zChyvKaotMuURo',
      senderId: 'D34YrNmoK2wFjLM8Opqr',
      content: 'I`ve prepared a presentation for our next meeting.',
      timestamp: serverTimestamp(),
      channelId: '5KvjC3MbUiNYBrgI1xZn',
    },
    {
      messageId: 'JnV3X4kA5MNHHsuY1kXm',
      senderId: 'DWFo4OWNuAxJ7IAlqLEl',
      content: 'The sales figures are looking great this quarter!',
      timestamp: serverTimestamp(),
      channelId: 'FJz45r1mh8K61V2EjIQ0',
    },
    {
      messageId: 'NWXkSVRIVYuxd5HlzGwN',
      senderId: 'TLYFvhadjakBvpVgtxvl',
      content: 'Let`s aim to close 5 more deals by the end of the month.',
      timestamp: serverTimestamp(),
      channelId: 'FJz45r1mh8K61V2EjIQ0',
      reactions: [
        {
          emoji: '🔥',
          userIds: ['DWFo4OWNuAxJ7IAlqLEl', 'TLYFvhadjakBvpVgtxvl'],
        },
      ],
    },
    {
      messageId: 'Qce0OVhiNKp3FJ1GZhWa',
      senderId: '20aHBf6jjiYESKjTY4ER',
      content: 'Can someone review the new marketing materials?',
      timestamp: new Date('2024-11-27T11:15:19Z'),
      channelId: 'ODLmxfQZXd4gexfQ9WBx',
      reactions: [
        {
          emoji: '🎉',
          userIds: ['20aHBf6jjiYESKjTY4ER', 'A5SvMpvvRniMIuh6wpv7'],
        },
        {
          emoji: '🔥',
          userIds: ['B78WxLhjM5vFnQP2Nort'],
        },
      ],
    },
    {
      messageId: 'RbJtjOUoQVNMEvfNJwjj',
      senderId: 'A5SvMpvvRniMIuh6wpv7',
      content: 'I´ve uploaded the updated banner designs.',
      timestamp: serverTimestamp(),
      channelId: 'ODLmxfQZXd4gexfQ9WBx',
    },
    {
      messageId: 'SgKDLC5Ax0dECON6W0An',
      senderId: '0IBkc05KwFZ6URDgZ28v',
      content: 'Our development progress is on track!',
      timestamp: serverTimestamp(),
      channelId: 'Sce57acZnV7DDXMRydN5',
    },
    {
      messageId: 'WgFFmtuyFRXW1OskHqWv',
      senderId: 'B78WxLhjM5vFnQP2Nort',
      content: 'I managed to resolve the encryption in the shower today.',
      timestamp: serverTimestamp(),
      channelId: 'Sce57acZnV7DDXMRydN5',
      reactions: [
        {
          emoji: '👍',
          userIds: ['C89RtYknQ1wFvGH7Jipo', 'D34YrNmoK2wFjLM8Opqr'],
        },
      ],
    },
    {
      messageId: 'Y7Pbxc9tCjaJO6Vez8jS',
      channelId: 'Sce57acZnV7DDXMRydN5',
      senderId: 'C89RtYknQ1wFvGH7Jipo',
      content: 'Hello everyone!',
      timestamp: new Date('2024-11-02T09:02:00Z'),
      reactions: [
        {
          emoji: '👍',
          userIds: ['DWFo4OWNuAxJ7IAlqLEl', 'TLYFvhadjakBvpVgtxvl'],
        },
      ],
    },
    {
      messageId: 'bXhHqpCW71KG8heuTJcd',
      channelId: 'Sce57acZnV7DDXMRydN5',
      senderId: 'B78WxLhjM5vFnQP2Nort',
      content: 'Hey there! Whats up ?!',
      timestamp: new Date('2024-11-13T15:10:00Z'),
      threadMessageCount: 2,
      lastThreadMessage: new Date('2024-11-18T02:11:00Z'),
    },
    {
      messageId: 'ki3gOz0HrWM8QXBrGdsB',
      channelId: 'Sce57acZnV7DDXMRydN5',
      senderId: 'D34YrNmoK2wFjLM8Opqr',
      content:
        'I´m great, thanks! After five years on the east coast... it was time to go home',
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadMessageCount: 4,
      lastThreadMessage: new Date('2024-11-17T00:10:00Z'),
      reactions: [
        {
          emoji: '🚀',
          userIds: [
            '20aHBf6jjiYESKjTY4ER',
            'A5SvMpvvRniMIuh6wpv7',
            'B78WxLhjM5vFnQP2Nort',
          ],
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
      senderId: 'DWFo4OWNuAxJ7IAlqLEl',
      content: 'How are you?',
      timestamp: new Date('2024-11-14T15:15:00Z'),
    },
    {
      messageId: 'nL6Udont99U7mVqCxomE',
      channelId: 'Sce57acZnV7DDXMRydN5',
      senderId: 'TLYFvhadjakBvpVgtxvl',
      content:
        'Given that your messages are updated frequently and data changes are dynamic, using pipes is the easiest and most straightforward approach for your situation.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
    },
    {
      messageId: 'nmxxhqR868cHNdwC1QkN',
      senderId: '20aHBf6jjiYESKjTY4ER',
      content: 'Our development progress is on track!',
      timestamp: serverTimestamp(),
      channelId: '2MScvzChDXWchtuFsJW9',
    },
    {
      messageId: 'oTVY4EM3QRwRett1eXCl',
      senderId: 'A5SvMpvvRniMIuh6wpv7',
      content: 'The new feature deployment is scheduled for tomorrow.',
      timestamp: serverTimestamp(),
      channelId: '2MScvzChDXWchtuFsJW9',
      reactions: [
        {
          emoji: '👍',
          userIds: ['D34YrNmoK2wFjLM8Opqr', 'DWFo4OWNuAxJ7IAlqLEl'],
        },
      ],
    },
    {
      messageId: 'qVSQIFmkNuRKFO3g3V2u',
      channelId: '2MScvzChDXWchtuFsJW9',
      senderId: 'B78WxLhjM5vFnQP2Nort',
      content: 'Hello everyone!',
      timestamp: new Date('2024-11-02T09:02:00Z'),
      reactions: [
        {
          emoji: '👍',
          userIds: ['TLYFvhadjakBvpVgtxvl', '20aHBf6jjiYESKjTY4ER'],
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
      content:
        'I´m great, thanks! After five years on the east coast... it was time to go home',
      timestamp: new Date('2024-11-14T15:15:00Z'),
      lastThreadMessage: new Date('2024-11-17T00:10:00Z'),
      reactions: [
        {
          emoji: '🚀',
          userIds: [
            'A5SvMpvvRniMIuh6wpv7',
            'B78WxLhjM5vFnQP2Nort',
            'C89RtYknQ1wFvGH7Jipo',
          ],
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
      senderId: 'DWFo4OWNuAxJ7IAlqLEl',
      content: 'How are you?',
      timestamp: new Date('2024-11-14T15:15:00Z'),
    },
    {
      messageId: '2222ffffffffffaaaaa1',
      channelId: '2MScvzChDXWchtuFsJW9',
      senderId: 'TLYFvhadjakBvpVgtxvl',
      content:
        'Given that your messages are updated frequently and data changes are dynamic, using pipes is the easiest and most straightforward approach for your situation.',
      timestamp: new Date('2024-11-16T15:15:00Z'),
    },
    {
      messageId: '2222ffffffffffaaaaa1',
      channelId: 'Sce57acZnV7DDXMRasdf',
      senderId: 'A5SvMpvvRniMIuh6wpv7',
      content:
        'Hello Team, welcome to our own Chat App in the style of slack or discord!',
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadMessageCount: 1,
      lastThreadMessage: new Date('2024-11-17T00:10:00Z'),
      reactions: [
        {
          emoji: '🚀',
          userIds: [
            'A5SvMpvvRniMIuh6wpv7',
            'B78WxLhjM5vFnQP2Nort',
            'C89RtYknQ1wFvGH7Jipo',
          ],
        },
        {
          emoji: '🌟',
          userIds: ['D34YrNmoK2wFjLM8Opqr'],
        },
        {
          emoji: '🙂',
          userIds: ['DWFo4OWNuAxJ7IAlqLEl', '0IBkc05KwFZ6URDgZ28v'],
        },
        {
          emoji: '😊',
          userIds: ['20aHBf6jjiYESKjTY4ER', 'TLYFvhadjakBvpVgtxvl'],
        },
        {
          emoji: '😎',
          userIds: ['20aHBf6jjiYESKjTY4ER', 'TLYFvhadjakBvpVgtxvl'],
        },
        {
          emoji: '🤖',
          userIds: ['20aHBf6jjiYESKjTY4ER', 'TLYFvhadjakBvpVgtxvl'],
        },
        {
          emoji: '🤓',
          userIds: ['20aHBf6jjiYESKjTY4ER', 'TLYFvhadjakBvpVgtxvl'],
        },
        {
          emoji: '😺',
          userIds: ['20aHBf6jjiYESKjTY4ER', 'TLYFvhadjakBvpVgtxvl'],
        },
      ],
    },
    {
      messageId: '2222ffffffffffaa5432',
      channelId: 'Sce57acZnV7DDXMRasdf',
      senderId: 'B78WxLhjM5vFnQP2Nort',
      content: 'Awesome, we can share images too!',
      timestamp: new Date('2024-11-17T15:15:00Z'),
      threadMessageCount: 1,
      lastThreadMessage: new Date('2024-11-18T00:10:00Z'),
      reactions: [
        {
          emoji: '🚀',
          userIds: [
            'DWFo4OWNuAxJ7IAlqLEl',
            'B78WxLhjM5vFnQP2Nort',
            '0IBkc05KwFZ6URDgZ28v',
          ],
        },
        {
          emoji: '🌟',
          userIds: ['D34YrNmoK2wFjLM8Opqr'],
        },
        {
          emoji: '😊',
          userIds: ['20aHBf6jjiYESKjTY4ER', 'TLYFvhadjakBvpVgtxvl'],
        },
      ],
      attachments: [{ type: 'image', url: userImages.avatar01 }],
    },
    {
      messageId: '2222ffffffffffaa7317',
      channelId: 'Sce57acZnV7DDXMRasdf',
      senderId: 'TLYFvhadjakBvpVgtxvl',
      content: 'Indeed, base64 conversion is awesome!',
      timestamp: new Date('2024-11-17T15:15:00Z'),
      threadMessageCount: 1,
      lastThreadMessage: new Date('2024-11-18T00:10:00Z'),
      reactions: [
        {
          emoji: '🌟',
          userIds: ['D34YrNmoK2wFjLM8Opqr'],
        },
      ],
      attachments: [{ type: 'image', url: userImages.avatar04 }],
    },
    {
      messageId: '2222ffffffffffaa7309',
      channelId: 'Sce57acZnV7DDXMRasdf',
      senderId: 'TLYFvhadjakBvpVgtxvl',
      content:
        'This is a long string test: Some languages, such as C++, Perl and Ruby, normally allow the contents of a string to be changed after it has been created; these are termed mutable strings. In other languages, such as Java, JavaScript, Lua, Python, and Go, the value is fixed and a new string must be created if any alteration is to be made; these are termed immutable strings. Some of these languages with immutable strings also provide another type that is mutable, such as Java and .NET`s StringBuilder, the thread-safe Java StringBuffer, and the Cocoa NSMutableString. There are both advantages and disadvantages to immutability: although immutable strings may require inefficiently creating many copies, they are simpler and completely thread-safe Strings are typically implemented as arrays of bytes, characters, or code units, in order to allow fast access to individual units or substrings—including characters when they have a fixed length. A few languages such as Haskell implement them as linked lists instead. ',
      timestamp: new Date('2024-11-17T16:15:00Z'),
      reactions: [
        {
          emoji: '🌟',
          userIds: ['D34YrNmoK2wFjLM8Opqr'],
        },
      ],
    },
  ];

  threadMessages: IMessage[] = [
    {
      messageId: 'threadmessage1',
      senderId: '20aHBf6jjiYESKjTY4ER',
      content: `Hello everyone!`,
      timestamp: new Date('2024-11-02T09:02:00Z'),
      threadId: 'ki3gOz0HrWM8QXBrGdsB',
      attachments: [
        {
          type: `image`,
          url: `https://example.com/image.png`,
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
      content: `Hey there! Whats up how is it going, the weather is so nice`,
      timestamp: new Date('2024-11-13T15:10:00Z'),
      threadId: 'ki3gOz0HrWM8QXBrGdsB',
    },
    {
      messageId: 'threadmessage3',
      senderId: 'B78WxLhjM5vFnQP2Nort',
      content: `I\`m great, thanks! After five years on the east coast... it was time to go home`,
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadId: 'ki3gOz0HrWM8QXBrGdsB',
      reactions: [
        {
          emoji: '🚀',
          userIds: [
            'B78WxLhjM5vFnQP2Nort',
            'A5SvMpvvRniMIuh6wpv7',
            '20aHBf6jjiYESKjTY4ER',
          ],
        },
        {
          emoji: '🌟',
          userIds: ['TLYFvhadjakBvpVgtxvl'],
        },
      ],
    },
    {
      messageId: 'threadmessage4',
      senderId: 'C89RtYknQ1wFvGH7Jipo',
      content: `How are you?`,
      timestamp: new Date('2024-11-14T15:15:00Z'),
      threadId: 'ki3gOz0HrWM8QXBrGdsB',
    },
    {
      messageId: 'threadmessage5',
      senderId: 'D34YrNmoK2wFjLM8Opqr',
      content: `Hmm customers ... yes.`,
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'CKVODbbY5HaIYS0QVROl',
    },
    {
      messageId: 'threadmessage6',
      senderId: 'DWFo4OWNuAxJ7IAlqLEl',
      content: `I am doing the testing yes.`,
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'bXhHqpCW71KG8heuTJcd',
      reactions: [
        {
          emoji: '🚀',
          userIds: [
            'DWFo4OWNuAxJ7IAlqLEl',
            'D34YrNmoK2wFjLM8Opqr',
            'C89RtYknQ1wFvGH7Jipo',
          ],
        },
        {
          emoji: '🌟',
          userIds: ['B78WxLhjM5vFnQP2Nort'],
        },
      ],
    },
    {
      messageId: 'threadmessage8',
      senderId: 'TLYFvhadjakBvpVgtxvl',
      content: `Awesome.`,
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'bXhHqpCW71KG8heuTJcd',
    },
    {
      messageId: 'threadmessage8',
      senderId: 'TLYFvhadjakBvpVgtxvl',
      content: `Thanks!`,
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: 'bXhHqpCW71KG8heuTJcd',
    },
    {
      messageId: 'threadmessa123',
      senderId: 'TLYFvhadjakBvpVgtxvl',
      content: `Thanks, excited to work together!`,
      timestamp: new Date('2024-11-16T15:15:00Z'),
      threadId: '2222ffffffffffaaaaa1',

      reactions: [
        {
          emoji: '🚀',
          userIds: [
            'TLYFvhadjakBvpVgtxvl',
            '20aHBf6jjiYESKjTY4ER',
            '0IBkc05KwFZ6URDgZ28v',
          ],
        },
        {
          emoji: '🌟',
          userIds: ['D34YrNmoK2wFjLM8Opqr'],
        },
        {
          emoji: '👍',
          userIds: ['DWFo4OWNuAxJ7IAlqLEl', 'B78WxLhjM5vFnQP2Nort'],
        },
        {
          emoji: '🎅',
          userIds: ['A5SvMpvvRniMIuh6wpv7', 'C89RtYknQ1wFvGH7Jipo'],
        },
      ],
    },
    {
      messageId: 'threadmessagek',
      senderId: 'TLYFvhadjakBvpVgtxvl',
      content: `Testing.`,
      timestamp: new Date('2024-11-20T15:15:00Z'),
      threadId: '2222ffffffffffaa5432',
    },
    {
      messageId: 'threadmessage8',
      senderId: 'D34YrNmoK2wFjLM8Opqr',
      content: `something is odd about Mona...`,
      timestamp: new Date('2024-11-20T15:15:00Z'),
      threadId: '2222ffffffffffaa7317',
    },
  ];
}
