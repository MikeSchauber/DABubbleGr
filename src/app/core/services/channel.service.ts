import { EventEmitter, inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  collectionData,
  writeBatch,
  serverTimestamp,arrayUnion, doc, 
  setDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay } from 'rxjs';
import { Channel } from '../../models/channel.model.class';
import { MemberService } from './member.service';
import { User } from '../../models/interfaces/user.interface';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private userService = inject(UserService);
  private firestore = inject(Firestore);

  private channelsSubject = new BehaviorSubject<Channel[]>([]); // BehaviorSubject für reaktive Kanäle
  channels$ = this.channelsSubject.asObservable(); // Observable für Komponenten


  ///Neu von Roman
  private currentChannelIdSubject = new BehaviorSubject<string | null>(null);
  currentChannelId$ = this.currentChannelIdSubject.asObservable();

  closeThreadBarEvent = new EventEmitter<void>();


  // Modify currentChannel$ to be derived from channels$ and currentChannelId$
  //Auf diese Weise reagiert der Chat Header auf Änderungen im currentChannel.[memberIds] array dynamisch
  currentChannel$ = combineLatest([this.channels$, this.currentChannelId$]).pipe(
  map(([channels, currentChannelId]) => {
    if (currentChannelId) {
      return channels.find(c => c.channelId === currentChannelId) || null;
    } else {
      return null;
    }
  }),
  shareReplay(1) // Optional: ensures subscribers get the latest value immediately
  );

  // Add the channelMembers$ observable
  readonly channelMembers$ = combineLatest([
    this.currentChannel$,
    this.userService.publicUsers$
  ]).pipe(
    map(([channel, users]) => {
      if (!channel || !users) return [];
      const memberIds = channel.memberIds || [];
      // Filter users to only include channel members
      return users.filter(user => memberIds.includes(user.publicUserId));
    }),
    shareReplay(1)
  );

  



  constructor() {
    this.loadChannels(); // Lädt Kanäle aus Firestore beim Start

  }

  private loadChannels() {
    const channelsCollection = collection(this.firestore, 'channels');
    const channelsObservable = collectionData(channelsCollection, { idField: 'channelId' }) as Observable<Channel[]>;
  
    channelsObservable.subscribe({
      next: (channels) => {
        this.channelsSubject.next(channels);
      },
      error: (error) => {
        console.error('Error fetching channels:', error);
      }
    });
  }

 
  async createChannel(name: string, description: string): Promise<string> {
    try {
      const now = new Date();
      const createdBy = 'currentUser'; // Replace with actual user ID if available
      const newChannelData = {
        name,
        description,
        createdBy,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        memberIds: [], // Initialize empty member IDs array
      };

      // Create the document in Firestore
      const channelsCollection = collection(this.firestore, 'channels');
      const docRef = await addDoc(channelsCollection, newChannelData);

      // Update the document with the generated Firestore ID
      await updateDoc(docRef, {
        channelId: docRef.id,
      });

      // Create a local Channel object
      const newChannel = new Channel(docRef.id, name, createdBy, now, now, description, []);

      // Update the local channel list
      this.channelsSubject.next([...this.channelsSubject.value, newChannel]);

      console.log(`Channel created with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  }




  /**
   * Fügt Mitglieder zu einem Kanal hinzu
   * @param channelId Die ID des Kanals
   * @param memberIds Eine Liste von Mitglieds-IDs
   */
  async addMembersToChannel(channelId: string, memberIds: string[]): Promise<void> {
    try {
      if (!channelId || memberIds.length === 0) {
        throw new Error('Ungültige Eingaben für Mitglieder oder Kanal-ID.');
      }

      const channelRef = doc(this.firestore, 'channels', channelId);

      // Mitglieder in Firestore hinzufügen (arrayUnion verhindert Duplikate)
      await updateDoc(channelRef, {
        memberIds: arrayUnion(...memberIds),
      });

      console.log(`Mitglieder erfolgreich zu Kanal ${channelId} hinzugefügt:`, memberIds);
    } catch (error) {
      console.error('Fehler beim Hinzufügen von Mitgliedern:', error);
      throw error;
    }
  }

  async removeMemberFromChannel(channelId: string, memberId: string) {
    // Optionale Erweiterung für das Entfernen von Mitgliedern
    console.warn('Diese Funktion ist noch nicht implementiert.');
  }



  //neu Roman
  setCurrentChannel(channelId: string) {
    this.currentChannelIdSubject.next(channelId);

    this.closeThreadBarEvent.emit();
    ///Event emitter here for dashboard component to close the thread bar.


    // console.log(`Channel service: Changed current channel to ${channelId}`);
  }



  









































//////////////////Roman: Dummy Data für Channels in firebase
async addDummyChannels() {
  try {
    // Step 1: Delete all existing documents in the 'channels' collection
    const channelsCollection = collection(this.firestore, 'channels');
    const querySnapshot = await getDocs(channelsCollection);

    const batchSize = 500; // Firestore allows up to 500 operations per batch
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

    console.log('All existing channels have been deleted.');

    // Step 2: Add dummy channels
    const dummyChannels = [
      {
        channelId: "Sce57acZnV7DDXMRydN5",
        name: 'Service',
        description: 'Verbesserungsvorschläge',
        createdBy:"currentUser",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds:[],

      },
      {
        channelId: "5KvjC3MbUiNYBrgI1xZn",
        name: 'Geschäftsführung',
        description: 'Discuss marketing strategies and campaigns',
        createdBy:"currentUser",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds:[],
      },
      {
        channelId: "FJz45r1mh8K61V2EjIQ0",
        name: 'Vertriebs Team',
        description: 'Sales team discussions and updates',
        createdBy:"currentUser",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds:[],
      },
      {
        channelId: "ODLmxfQZXd4gexfQ9WBx",
        name: 'Marketing Team',
        description: 'Customer support and issue tracking',
        createdBy:"currentUser",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds:[],
      },
      {
        
        channelId: "2MScvzChDXWchtuFsJW9",
        name: 'Team Entwicklung',
        description: 'Human resources discussions',
        createdBy:"currentUser",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds:[],
      },
      // Add more channels as needed
    ];

    for (const channelData of dummyChannels) {
      // try {
      //   await this.createChannel(channelData.name, channelData.description);
      //   // console.log(`Dummy channel "${channelData.name}" added.`);
      // } catch (error) {
      //   // console.error(`Error adding dummy channel "${channelData.name}":`, error);
      // }
      const userDocRef = doc(channelsCollection, channelData.channelId); // Use setDoc with specific ID

      await setDoc(userDocRef, {

       channelId: channelData.channelId,
        name: channelData.name,
        description: channelData.description,
        createdBy: "currentUser",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds:[],
      });

    }

    console.log('Dummy channels have been added.');
  } catch (error) {
    console.error('Error in addDummyChannels:', error);
  }
}


async populateChannelsWithMembers() {
  try {
    // Fetch all public user data
    const publicUserDataCollection = collection(this.firestore, 'publicUserDataClone');
    const publicUsersSnapshot = await getDocs(publicUserDataCollection);

    // Extract publicUserIds from the fetched data
    const publicUserIds = publicUsersSnapshot.docs.map((doc) => doc.id);

    if (publicUserIds.length === 0) {
      console.warn('No public users found in publicUserData collection.');
      return;
    }

    // Fetch all channels
    const channelsCollection = collection(this.firestore, 'channels');
    const channelsSnapshot = await getDocs(channelsCollection);

    const batchSize = 500; // Firestore batch limit
    let batch = writeBatch(this.firestore);
    let operationCount = 0;

    for (const channelDoc of channelsSnapshot.docs) {
      // Randomly select a number of members (0 to 9)
      const numMembers = Math.floor(Math.random() * 7);

      // Shuffle publicUserIds and select `numMembers` random IDs
      const shuffledUserIds = this.shuffleArray([...publicUserIds]); // Copy array to avoid mutating the original
      const selectedMemberIds = shuffledUserIds.slice(0, numMembers);

      // Update the channel's memberIds array
      const channelRef = channelDoc.ref;
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

    console.log('Channels have been populated with random public users.');
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
    avatarUrl: "../../../../assets/basic-avatars/avatar3.svg",
    userStatus: "away",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "EwsT2NlbuzUSbCo1NBpI",
    displayName: "Sophia Fischer",
    email: "sophia.fischer@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar2.svg",
    userStatus: "offline",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "Hvk1x9JzzgSEls58gGFc",
    displayName: "Max Weber",
    email: "max.weber@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar4.svg",
    userStatus: "online",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "QGWf2rbPuuwMCip3Ph2A",
    displayName: "Lyra Becker",
    email: "lyra.becker@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar6.svg",
    userStatus: "away",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "Wkk9yqyKuLmPo7lIdXxa",
    displayName: "Karl Wagner",
    email: "karl.wagner@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar5.svg",
    userStatus: "online",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "bcQkM31D0UR1qxadZOkU",
    displayName: "Lukas Schulz",
    email: "lukas.schulz@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar1.svg",
    userStatus: "offline",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "pUXpEwRmd5Cmwdg9R4P8",
    displayName: "Anna Hoffmann",
    email: "anna.hoffmann@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar2.svg",
    userStatus: "away",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "xZZm8TPXkaKZPaDnofVt",
    displayName: "Alex Schneider",
    email: "astra.schneider@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar3.svg",
    userStatus: "online",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "y3TgOxVJGVRKZMb1fU6Z",
    displayName: "Paul Meyer",
    email: "paul.meyer@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar4.svg",
    userStatus: "offline",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
];


async resetPublicUserData() {
  try {
    const publicUserDataCollection = collection(this.firestore, 'publicUserDataClone');

    // Step 1: Delete all existing documents in the collection
    const querySnapshot = await getDocs(publicUserDataCollection);

    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
      console.log(`Deleted document with ID: ${doc.id}`);
    }
    console.log('All existing documents in publicUserDataClone collection have been deleted.');

    // Step 2: Add users from the `users` array with their `publicUserId` as the document ID
    for (const user of this.users) {
      const userDocRef = doc(publicUserDataCollection, user.publicUserId); // Use setDoc with specific ID

      await setDoc(userDocRef, {
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        userStatus: user.userStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publicUserId: user.publicUserId,
      });

    

      console.log(`User ${user.displayName} added with ID: ${user.publicUserId}`);
    }

    console.log('All users have been repopulated in the publicUserDataClone collection with correct document IDs.');
  } catch (error) {
    console.error('Error resetting publicUserDataClone:', error);
  }
}





























}