import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  collectionData,
  writeBatch,
  serverTimestamp
} from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay } from 'rxjs';
import { Channel } from '../../models/channel.model.class';
import { MemberService } from './member.service';
import { User } from '../../models/interfaces/user.interface';

import { arrayUnion, doc } from 'firebase/firestore';
// import { serverTimestamp } from 'firebase/firestore';


@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private channelsSubject = new BehaviorSubject<Channel[]>([]); // BehaviorSubject für reaktive Kanäle
  channels$ = this.channelsSubject.asObservable(); // Observable für Komponenten


  ///Neu von Roman
  private currentChannelIdSubject = new BehaviorSubject<string | null>(null);
  currentChannelId$ = this.currentChannelIdSubject.asObservable();


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


  ////for offline rendering...
  channels: any;

  constructor(private firestore: Firestore, private memberService: MemberService) {
    this.loadChannels(); // Lädt Kanäle aus Firestore beim Start

    ////for offline rendering...
  this.channels= [
    {
      channelId: 'channel01',
      name: 'Entwicklerteam',
      description: 'Main channel for general discussion',
      createdBy: 'adminUserId',
      createdAt: new Date('2024-01-01T12:00:00Z'),
      updatedAt: new Date('2024-11-13T12:00:00Z'),
      memberIds: ['user123', 'user456', 'user45655', 'user1234'],
    },
  ];

  }

  /**
   * Lädt die bestehenden Kanäle aus Firestore und aktualisiert das BehaviorSubject
   */
  // private async loadChannels() {
  //   try {
  //     const querySnapshot = await getDocs(collection(this.firestore, 'channels'));
  //     const channels: Channel[] = querySnapshot.docs.map(doc =>
  //       Channel.fromFirestoreData(doc.data(), doc.id)
  //     );
  //     this.channelsSubject.next(channels); // Lokale Kanäle aktualisieren
  //   } catch (error) {
  //     console.error('Fehler beim Laden der Kanäle:', error);
  //   }
  // }
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

  /**
   * Erstellt einen neuen Kanal und speichert ihn in Firestore
   * @param name Der Name des Kanals
   * @param description Die Beschreibung des Kanals (optional)
   */


  // async createChannel(name: string, description: string): Promise<string> {
  //   try {
  //     const now = new Date();
  //     const createdBy = 'currentUser'; // Beispiel: AuthService.getCurrentUserId()
  //     const newChannelData = {
  //       name,
  //       description,
  //       createdBy,
  //       createdAt: now.toISOString(),
  //       updatedAt: now.toISOString(),
  //       memberIds: [], // Initialisiere leere Mitgliederliste
  //     };

  //     // Erstelle das Dokument in Firestore
  //     const docRef = await addDoc(collection(this.firestore, 'channels'), newChannelData);

  //     // Aktualisiere das Dokument mit der generierten Firestore-ID
  //     await updateDoc(doc(this.firestore, 'channels', docRef.id), {
  //       channelId: docRef.id, 
  //     });

  //     // Lokales Channel-Objekt erstellen
  //     const newChannel = new Channel(
  //       docRef.id,
  //       name,
  //       createdBy,
  //       now,
  //       now,
  //       description,
  //       []
  //     );

  //     // Aktualisiere die lokale Kanalliste
  //     this.channelsSubject.next([...this.channelsSubject.value, newChannel]);

  //     console.log(`Channel created with ID: ${docRef.id}`);
  //     return docRef.id; // Gibt die ID des erstellten Kanals zurück
  //   } catch (error) {
  //     console.error('Fehler beim Erstellen des Kanals:', error);
  //     throw error;
  //   }
  // }


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

  
  /**
   * Löscht ein Mitglied aus einem Kanal (falls benötigt)
   * @param channelId Die ID des Kanals
   * @param memberId Die ID des Mitglieds
   */
  async removeMemberFromChannel(channelId: string, memberId: string) {
    // Optionale Erweiterung für das Entfernen von Mitgliedern
    console.warn('Diese Funktion ist noch nicht implementiert.');
  }



  //neu Roman
  setCurrentChannel(channelId: string) {
    this.currentChannelIdSubject.next(channelId);
    console.log(`Channel service: Changed current channel to ${channelId}`);
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
        name: 'Service',
        description: 'Verbesserungsvorschläge',
        createdBy:"currentUser",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds:[],

      },
      {
        name: 'Geschäftsführung',
        description: 'Discuss marketing strategies and campaigns',
        createdBy:"currentUser",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds:[],
      },
      {
        name: 'Vertriebs Team',
        description: 'Sales team discussions and updates',
        createdBy:"currentUser",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds:[],
      },
      {
        name: 'Marketing Team',
        description: 'Customer support and issue tracking',
        createdBy:"currentUser",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds:[],
      },
      {
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
      try {
        await this.createChannel(channelData.name, channelData.description);
        // console.log(`Dummy channel "${channelData.name}" added.`);
      } catch (error) {
        // console.error(`Error adding dummy channel "${channelData.name}":`, error);
      }
    }

    console.log('Dummy channels have been added.');
  } catch (error) {
    console.error('Error in addDummyChannels:', error);
  }
}


  
async populateChannelsWithMembers() {
  try {
    const channelsCollection = collection(this.firestore, 'channels');
    const channelsSnapshot = await getDocs(channelsCollection);

    const batchSize = 500; // Firestore batch limit
    let batch = writeBatch(this.firestore);
    let operationCount = 0;

    for (const channelDoc of channelsSnapshot.docs) {
      // Randomly select between 0 and 7 users
      const numMembers = Math.floor(Math.random() * 9);//random members count from 0 - 9 

      // Shuffle the users array and pick numMembers users
      const shuffledUsers = this.shuffleArray([...this.users]); // Copy the array to prevent modifying the original
      const selectedUsers = shuffledUsers.slice(0, numMembers);
      const memberIds = selectedUsers.map((user) => user.publicUserId);

      // Update the channel's memberIds array
      const channelRef = channelDoc.ref;
      batch.update(channelRef, { memberIds });
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

    console.log('Channels have been populated with random members.');
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
    publicUserId: "dummyid234535",
    displayName: "Luna Müller",
    email: "luna.mueller@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar1.svg",
    userStatus: "online",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "dummyid234535",
    displayName: "Hans Schmidt",
    email: "hans.schmidt@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar2.svg",
    userStatus: "abwesend",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "dummyid234ffaf",
    displayName: "Sophia Fischer",
    email: "sophia.fischer@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar3.svg",
    userStatus: "offline",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "dummyid1145fasdf35",
    displayName: "Max Weber",
    email: "max.weber@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar4.svg",
    userStatus: "online",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "dummyiddfg26",
    displayName: "Lyra Becker",
    email: "lyra.becker@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar5.svg",
    userStatus: "abwesend",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "dummyid999hdd",
    displayName: "Karl Wagner",
    email: "karl.wagner@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar6.svg",
    userStatus: "online",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "dummyid8844gdg",
    displayName: "Lukas Schulz",
    email: "lukas.schulz@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar1.svg",
    userStatus: "offline",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "dummyid834gegg",
    displayName: "Anna Hoffmann",
    email: "anna.hoffmann@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar2.svg",
    userStatus: "abwesend",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "dummyid007hh",
    displayName: "Astra Schneider",
    email: "astra.schneider@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar3.svg",
    userStatus: "online",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    publicUserId: "dummyid331ff",
    displayName: "Paul Meyer",
    email: "paul.meyer@example.com",
    avatarUrl: "../../../../assets/basic-avatars/avatar4.svg",
    userStatus: "offline",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
];
 /**
   * Clears the `publicUserData` collection and repopulates it with users from the `users` array.
   */
 async resetPublicUserData() {
  try {
    const publicUserDataCollection = collection(this.firestore, 'publicUserData');
    const querySnapshot = await getDocs(publicUserDataCollection);

    // Batch delete all existing documents
    const batchSize = 500; // Firestore batch limit
    let batch = writeBatch(this.firestore);
    let operationCount = 0;

    for (const doc of querySnapshot.docs) {
      batch.delete(doc.ref);
      operationCount++;

      if (operationCount === batchSize) {
        await batch.commit();
        batch = writeBatch(this.firestore);
        operationCount = 0;
      }
    }

    // Commit any remaining deletes
    if (operationCount > 0) {
      await batch.commit();
    }

    console.log('All documents in publicUserData collection have been deleted.');

    // Add users from the array to the collection
    const updatedUsers: User[] = [];
    for (const user of this.users) {
      const docRef = await addDoc(publicUserDataCollection, {
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        userStatus: user.userStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update the document to include the publicUserId
      await updateDoc(docRef, {
        publicUserId: docRef.id,
      });

      // Update the publicUserId in the offline users array field with the document ID
      const updatedUser = { ...user, publicUserId: docRef.id };
      updatedUsers.push(updatedUser);

      console.log(`User ${user.displayName} added with ID: ${docRef.id}`);
    }

    // Update the local users array with the correct publicUserId values
    this.users = updatedUsers;

    console.log('Users have been repopulated in the publicUserData collection.');
  } catch (error) {
    console.error('Error resetting publicUserData:', error);
  }
}



}