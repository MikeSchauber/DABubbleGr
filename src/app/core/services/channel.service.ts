import { EventEmitter, inject, Injectable, OnDestroy } from '@angular/core';
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
import { BehaviorSubject, combineLatest, filter, first, map, Observable, shareReplay, Subject, takeUntil } from 'rxjs';
import { Channel } from '../../models/channel.model.class';
import { MemberService } from './member.service';
import { User } from '../../models/interfaces/user.interface';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { onAuthStateChanged } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class ChannelService implements OnDestroy  {

  private destroy$ = new Subject<void>(); 
  // private userService = inject(UserService);
  private firestore = inject(Firestore);

  public channelsSubject = new BehaviorSubject<Channel[]>([]); // BehaviorSubject für reaktive Kanäle
  currentUserId: string = '';

  //Channel Liste als Observable für Komponenten
  channels$ = this.channelsSubject.asObservable();

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



 
  
  


  constructor(public authService: AuthService) {
    // Listen to auth state changes
    onAuthStateChanged(this.authService.auth, (user) => {
      if (user) {
       // this.currentUserId = this.authService.currentUserData.publicUserId;
        this.loadChannels();

     // After loading channels, check for "Welcome Team!"
     this.checkWelcomeTeamChannel();

      } else {
        // User logged out, clear channels and unsubscribe
        this.channelsSubject.next([]);
        this.destroy$.next();
        this.destroy$.complete();
      }
    });
  }


  ngOnDestroy(): void {
    this.destroy$.next(); // Emit a value to signal all subscriptions should close
    this.destroy$.complete(); // Complete the subject to clean up resources
  }

  //   ////Hier muss noch gefiltert werden, anhand wo currentUserId auch in den channelMember[] arrays der channels vorhanden ist ! 
  //   ////Hier muss noch gefiltert werden, anhand wo currentUserId auch in den channelMember[] arrays der channels vorhanden ist ! 
  //   ////Hier muss noch gefiltert werden, anhand wo currentUserId auch in den channelMember[] arrays der channels vorhanden ist ! 
  private loadChannels(): void {
    const channelsCollection = collection(this.firestore, 'channels');
    const channelsObservable = collectionData(channelsCollection, { idField: 'channelId' }) as Observable<Channel[]>;

    channelsObservable.pipe(
      map((channels) => {
        // 1. Sort by creation date
        let sorted = [...channels].sort((a, b) => {
          const createdAtA = new Date(a.createdAt).getTime() || 0;
          const createdAtB = new Date(b.createdAt).getTime() || 0;
          return createdAtA - createdAtB;
        });

        // 2. Promote "Welcome Team!" to the top if it exists
        sorted = sorted.sort((a, b) => {
          if (a.name === 'Welcome Team!') return -1;
          if (b.name === 'Welcome Team!') return 1;
          return 0;
        });

        return sorted;
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (finalSortedChannels) => {
        this.channelsSubject.next(finalSortedChannels);
      },
      error: (error) => {
        console.error('Error fetching channels:', error);
      },
    });
  }


  /**
   * Check if "Welcome Team!" channel exists.
   * If yes, set current channel to it.
   * If not, update Firestore doc with ID "Sce57acZnV7DDXMRasdf" to include currentUserId.
   */
  private checkWelcomeTeamChannel(): void {
    this.channels$.pipe(
      first()
    ).subscribe(async (channels) => {
      const welcomeTeamChannel = channels.find(ch => ch.name === 'Welcome Team!');

      if (welcomeTeamChannel) {
        // If found, set it as current channel
        this.setCurrentChannel(welcomeTeamChannel.channelId);
      } else {
        // If not found, update Firestore doc "Sce57acZnV7DDXMRasdf"
        await this.addUserToWelcomeTeamChannelInFirestore();
      }
    });
  }

    /**
   * Adds the current user to the members array of the Firestore document
   * with the key "Sce57acZnV7DDXMRasdf".
   */
    private async addUserToWelcomeTeamChannelInFirestore(): Promise<void> {
      if (!this.authService.currentUserData.publicUserId) return;
  
      const channelId = 'Sce57acZnV7DDXMRasdf';
      const channelRef = doc(this.firestore, 'channels', channelId);
  
      try {
        await updateDoc(channelRef, {
          memberIds: arrayUnion(this.authService.currentUserData.publicUserId),
        });
        console.log(`Current user ${this.authService.currentUserData.publicUserId} added to Welcome Team channel in Firestore.`);
        this.setCurrentChannel(channelId);
       
      } catch (error) {
        console.error('Error updating Welcome Team channel:', error);
      }
    }


 
  async createChannel(name: string, description: string): Promise<string> {
    try {
      const now = new Date();
      const createdBy = this.authService.currentUserData.publicUserId; // Replace with actual user ID if available
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
  
      // Sort channels by `createdAt` after adding the new one
      const updatedChannels = [...this.channelsSubject.value, newChannel].sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  
      // Update the local channel list
      this.channelsSubject.next(updatedChannels);
  
      console.log(`Channel created with ID: ${docRef.id}`);
  
      // Set the new channel as the current active channel
      this.setCurrentChannel(docRef.id);
  
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
    console.log('Adding members to channel:', { channelId, memberIds }); // Debug log
    try {
      if (!channelId || memberIds.length === 0) {
        console.error('Invalid channelId or memberIds:', { channelId, memberIds }); // Debug log
        throw new Error('Ungültige Eingaben für Mitglieder oder Kanal-ID.');
      }
  
      const channelRef = doc(this.firestore, 'channels', channelId);
  
      await updateDoc(channelRef, {
        memberIds: arrayUnion(...memberIds),
      });
  
      console.log(`Members successfully added to channel ${channelId}:`, memberIds);
    } catch (error) {
      console.error('Error while adding members:', error);
      throw error;
    }
  }
  

  async updateChannel(channelId: string, name: string, description: string): Promise<void> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);
  
      await updateDoc(channelRef, {
        name,
        description,
        updatedAt: new Date(),
      });
  
      console.log(`Channel ${channelId} updated successfully.`);
  
      // Lokale Daten aktualisieren
      const updatedChannels = this.channelsSubject.value.map((channel) =>
        channel.channelId === channelId ? { ...channel, name, description } : channel
      );
  
      this.channelsSubject.next(updatedChannels);
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  }
  
  async removeMemberFromChannel(channelId: string, memberId: string): Promise<void> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);
      await updateDoc(channelRef, {
        memberIds: this.arrayRemove(memberId), // Entfernt die ID aus dem Array
      });
      console.log(`Mitglied ${memberId} erfolgreich entfernt.`);
    } catch (error) {
      console.error('Fehler beim Entfernen des Mitglieds:', error);
    }
  }
  
  arrayRemove(memberId: string): any {
    return (array: string[]) => array.filter(id => id !== memberId);
  }
  

  /**
   * Sets the current channel to display
   * @param channelId - ID of the channel to display
   */
  displayChannel(channelId: string): void {
    this.setCurrentChannel(channelId);
  }

  /**
   * Sets the current channel ID
   * @param channelId - ID of the channel
   */
  setCurrentChannel(channelId: string): void {
    this.currentChannelIdSubject.next(channelId);

    this.closeThreadBarEvent.emit();
    ///Event emitter here for dashboard component to close the thread bar.


    // console.log(`Channel service: Changed current channel to ${channelId}`);
  }



//When clicking on a other user in the sidenav and no messages exist between two users, create new direct message channel
async createPrivateChannel(conversationId: string, otherUserId: string): Promise<string> {
  console.log("conversationId:", conversationId)

  try {
    const now = new Date();
    const createdBy = this.authService.currentUserData.publicUserId;    
    const channelName = `DM_${conversationId}`;

    // Use conversationId as both the doc ID and channelId
    const newChannelData = {
      type: 'private',
      channelId: conversationId,
      createdBy: createdBy,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      memberIds: [this.authService.currentUserData.publicUserId, otherUserId],
      name: channelName,
      lastReadInfo: {
        [this.authService.currentUserData.publicUserId]: {
          lastReadTimestamp: now.toISOString(),
          messageCount: 0
        },
        [otherUserId]: {
          lastReadTimestamp: now.toISOString(),
          messageCount: 0
        }
      }
    };

    const channelsCollection = collection(this.firestore, 'channels');
    const channelDocRef = doc(channelsCollection, conversationId);

    // Use setDoc to create the document with conversationId as the key
    await setDoc(channelDocRef, newChannelData);

    const newChannel = Channel.fromFirestoreData(newChannelData, conversationId);

    // Append the new channel to the existing list
    const updatedChannels = [...this.channelsSubject.value, newChannel];
    this.channelsSubject.next(updatedChannels);

    return conversationId;
  } catch (error) {
    console.error('Error creating private channel:', error);
    throw error;
  }
}




























//////////////////Roman: Dummy Data für Channels in firebase

  private users: User[] = []; 

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
        channelId: "Sce57acZnV7DDXMRasdf",
        name: 'Welcome Team!',
        description: 'Ein Kanal für alle neuen Mitglieder!',
        createdBy:"currentUser",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberIds:[],

      },
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
    const publicUserDataCollection = collection(this.firestore, 'publicUserData');
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