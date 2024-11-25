import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  collectionData,
  setDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Channel } from '../../models/channel.model.class';
import { MemberService } from './member.service';
import { User } from '../../models/interfaces/user.interface';


@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private channelsSubject = new BehaviorSubject<Channel[]>([]); // BehaviorSubject für reaktive Kanäle
  channels$ = this.channelsSubject.asObservable(); // Observable für Komponenten


  ///Neu von Roman
  private currentChannelSubject = new BehaviorSubject<Channel | null>(null);
  currentChannel$ = this.currentChannelSubject.asObservable();

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
    // ...additional channels
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



  // async createChannel(name: string, description: string): Promise<string> {
  //   try {
  //     const now = new Date();
  //     const createdBy = 'currentUser'; // Replace with actual user ID if available
  //     const newChannelData = {
  //       name,
  //       description,
  //       createdBy,
  //       createdAt: now.toISOString(),
  //       updatedAt: now.toISOString(),
  //       memberIds: [], // Initialize empty member IDs array
  //     };
  
  //     // Create the document in Firestore
  //     const channelsCollection = collection(this.firestore, 'channels');
  //     const docRef = await addDoc(channelsCollection, newChannelData);
  
  //     // Update the document with the generated Firestore ID
  //     await updateDoc(docRef, {
  //       channelId: docRef.id,
  //     });
  
  //     // Create a local Channel object
  //     const newChannel = new Channel(
  //       docRef.id,
  //       name,
  //       createdBy,
  //       now,
  //       now,
  //       description,
  //       []
  //     );
  
  //     // Update the local channel list
  //     this.channelsSubject.next([...this.channelsSubject.value, newChannel]);
  
  //     console.log(`Channel created with ID: ${docRef.id}`);
  //     return docRef.id;
  //   } catch (error) {
  //     console.error('Error creating channel:', error);
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
   * Fügt ein Mitglied zu einem Kanal hinzu
   * @param channelId Die ID des Kanals
   * @param memberId Die ID des Mitglieds
   */



  async addMemberToChannel(channelId: string, memberId: string) {
    try {
      await this.memberService.addMemberToChannel(channelId, memberId);
      console.log(`Mitglied ${memberId} erfolgreich zu Kanal ${channelId} hinzugefügt.`);
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Mitglieds:', error);
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
    const channel = this.channelsSubject.value.find(c => c.channelId === channelId);
    
    if (channel) {
      this.currentChannelSubject.next(channel);
      console.log(`channel service: Changed currentchannel to ${channelId}`);
    } else {
      console.error(`Channel with ID ${channelId} not found.`);
    }
  }








///Roman: Dummy Data für Channels in firebase
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
        name: 'Entwicklerteam',
        description: 'Main channel for general discussion',
      },
      {
        name: 'Marketing',
        description: 'Discuss marketing strategies and campaigns',
      },
      {
        name: 'Sales',
        description: 'Sales team discussions and updates',
      },
      {
        name: 'Support',
        description: 'Customer support and issue tracking',
      },
      {
        name: 'HR',
        description: 'Human resources discussions',
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


users: User[] = [
  {
    userId: 'user001',
    displayName: 'Alice',
    avatarUrl: '../../../../assets/basic-avatars/avatar1.svg',
    joinedAt: new Date('2024-01-05T15:30:00Z'),
    role: 'member',
  },
  {
    userId: 'user002',
    displayName: 'Bob',
    avatarUrl: '../../../../assets/basic-avatars/avatar2.svg',
    joinedAt: new Date('2024-01-06T10:00:00Z'),
    role: 'moderator',
  },
  {
    userId: 'user003',
    displayName: 'Charlie',
    avatarUrl: '../../../../assets/basic-avatars/avatar3.svg',
    joinedAt: new Date('2024-01-07T12:15:00Z'),
    role: 'member',
  },
  {
    userId: 'user004',
    displayName: 'Diana',
    avatarUrl: '../../../../assets/basic-avatars/avatar4.svg',
    joinedAt: new Date('2024-01-08T14:45:00Z'),
    role: 'member',
  },
  {
    userId: 'user005',
    displayName: 'Ethan',
    avatarUrl: '../../../../assets/basic-avatars/avatar5.svg',
    joinedAt: new Date('2024-01-09T16:20:00Z'),
    role: 'member',
  },
  {
    userId: 'user006',
    displayName: 'Fiona',
    avatarUrl: '../../../../assets/basic-avatars/avatar6.svg',
    joinedAt: new Date('2024-01-10T09:30:00Z'),
    role: 'member',
  },
  {
    userId: 'user007',
    displayName: 'George',
    avatarUrl: '../../../../assets/basic-avatars/avatar1.svg',
    joinedAt: new Date('2024-01-11T11:00:00Z'),
    role: 'member',
  },
  {
    userId: 'user008',
    displayName: 'Hannah',
    avatarUrl: '../../../../assets/basic-avatars/avatar2.svg',
    joinedAt: new Date('2024-01-12T13:15:00Z'),
    role: 'member',
  },
  {
    userId: 'user009',
    displayName: 'Ian',
    avatarUrl: '../../../../assets/basic-avatars/avatar3.svg',
    joinedAt: new Date('2024-01-13T15:45:00Z'),
    role: 'member',
  },
  {
    userId: 'user010',
    displayName: 'Jane',
    avatarUrl: '../../../../assets/basic-avatars/avatar10.svg',
    joinedAt: new Date('2024-01-14T17:25:00Z'),
    role: 'member',
  },
];
  
async populateChannelsWithMembers() {
  try {
    const channelsCollection = collection(this.firestore, 'channels');
    const channelsSnapshot = await getDocs(channelsCollection);

    const batchSize = 500; // Firestore batch limit
    let batch = writeBatch(this.firestore);
    let operationCount = 0;

    for (const channelDoc of channelsSnapshot.docs) {
      // Randomly select between 0 and 7 users
      const numMembers = Math.floor(Math.random() * 8); // 0 to 7 inclusive

      // Shuffle the users array and pick numMembers users
      const shuffledUsers = this.shuffleArray([...this.users]); // Copy the array to prevent modifying the original
      const selectedUsers = shuffledUsers.slice(0, numMembers);
      const memberIds = selectedUsers.map((user) => user.userId);

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


}