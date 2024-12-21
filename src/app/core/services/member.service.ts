import { Injectable } from '@angular/core';
import {
  Firestore,
  updateDoc,
  doc,
  arrayUnion,
  collection,
  getDocs,
  getDoc,
} from '@angular/fire/firestore';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  shareReplay,
} from 'rxjs';
import { ChannelService } from './channel.service';
import { UserService } from './user.service';
import { User } from '../../models/interfaces/user.interface';
import { Inject } from '@angular/core';
import { InfoFlyerService } from './info-flyer.service';

/**
 * Service for managing members of a channel.
 * Handles operations such as adding members, retrieving member details, and updating member information.
 */
@Injectable({
  providedIn: 'root',
})
export class MemberService {
  channelMembers$: Observable<User[]>;

  constructor(
    private firestore: Firestore,
    private channelService: ChannelService,
    private userService: UserService,
    @Inject(InfoFlyerService) private infoService: InfoFlyerService
  ) {
    /**
    * Combines the current channel and public users to filter and provide
    * the list of members belonging to the current channel.
    */
    this.channelMembers$ = combineLatest([
      this.channelService.currentChannel$.pipe(
        distinctUntilChanged((prev, curr) => {
          // Compare memberIds arrays specifically
          return (
            JSON.stringify(prev?.memberIds) === JSON.stringify(curr?.memberIds)
          );
        })
      ),
      this.userService.publicUsers$.pipe(
        distinctUntilChanged((prev, curr) => {
          return JSON.stringify(prev) === JSON.stringify(curr);
        })
      ),
    ]).pipe(
      map(([channel, users]) => {
        if (!channel || !users) return [];
        const memberIds = channel.memberIds || [];
        return users.filter((user) => memberIds.includes(user.publicUserId));
      }),
      shareReplay(1)
    );
  }

  /**
  * Adds a single member to a channel.
  * @param channelId - The ID of the channel.
  * @param memberId - The ID of the member to be added.
  */
  async addMemberToChannel(channelId: string, memberId: string): Promise<void> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);
      await updateDoc(channelRef, {
        memberIds: arrayUnion(memberId),
      });
    } catch (error) {
      console.error(
        `Fehler beim Hinzufügen von Mitglied ${memberId} zu Kanal ${channelId}:`,
        error
      );
      throw error;
    }
  }

  /**
  * Adds multiple members to a channel.
  * @param channelId - The ID of the channel.
  * @param memberIds - A list of member IDs to be added.
  */
  async addMembersToChannel(
    channelId: string,
    memberIds: string[]
  ): Promise<void> {
    try {
      if (!channelId || memberIds.length === 0) {
        throw new Error(
          'Ungültige Eingaben für Kanal-ID oder Mitgliederliste.'
        );
      }

      const channelRef = doc(this.firestore, 'channels', channelId);
      await updateDoc(channelRef, {
        memberIds: arrayUnion(...memberIds),
      }); 
    } catch (error) {
      console.error(
        `Fehler beim Hinzufügen von Mitgliedern zu Kanal ${channelId}:`,
        error
      );
      throw error;
    }
  }

  /**
  * Retrieves all members of a specific channel.
  * @param channelId - The ID of the channel.
  * @returns A list of member IDs.
  */
  async getMembersOfChannel(channelId: string): Promise<string[]> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);
      const channelSnapshot = await getDoc(channelRef);

      if (!channelSnapshot.exists()) {
        console.warn(`Kanal mit ID ${channelId} existiert nicht.`);
        return [];
      }

      const channelData = channelSnapshot.data();
      return channelData?.['memberIds'] || [];
    } catch (error) {
      console.error(
        `Fehler beim Abrufen der Mitglieder von Kanal ${channelId}:`,
        error
      );
      throw error;
    }
  }

  /**
  * Updates the avatar of a specific member.
  * @param memberId - The ID of the member.
  * @param newAvatarUrl - The new avatar URL.
  */
  async updateMemberAvatar(
    memberId: string,
    newAvatarUrl: string
  ): Promise<void> {
    try {
      const memberRef = doc(this.firestore, 'publicUserData', memberId);
      await updateDoc(memberRef, { avatarUrl: newAvatarUrl });
    } catch (error) {
      console.error(
        `Fehler beim Aktualisieren des Avatars für Mitglied ${memberId}:`,
        error
      );
      throw error;
    }
  }

  /**
  * Retrieves the data of a specific member by their ID.
  * @param memberId - The ID of the member.
  * @returns The data of the member or `null` if not found.
  */
  async getMemberById(memberId: string): Promise<any> {
    try {
      const memberRef = doc(this.firestore, 'publicUserData', memberId);
      const memberSnapshot = await getDoc(memberRef);

      if (!memberSnapshot.exists()) {
        console.warn(`Mitglied mit ID ${memberId} existiert nicht.`);
        // Prüfen, ob memberId ein Name ist
        const membersCollection = collection(this.firestore, 'publicUserData');
        const querySnapshot = await getDocs(membersCollection);
        const member = querySnapshot.docs.find(
          (doc) => doc.data()['displayName'] === memberId
        );

        if (member) {
          return member.data();
        }

        return null;
      }

      return memberSnapshot.data();
    } catch (error) {
      console.error(`Fehler beim Abrufen des Mitglieds ${memberId}:`, error);
      throw error;
    }
  }

  /**
  * Retrieves all members from the `publicUserData` collection.
  * @returns A list of all members with their data.
  */
  async fetchAllMembers(): Promise<any[]> {
    try {
      const membersCollection = collection(this.firestore, 'publicUserData');
      const querySnapshot = await getDocs(membersCollection);
      const members = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })); 
      return members;
    } catch (error) {
      console.error('Fehler beim Abrufen aller Mitglieder:', error);
      throw error;
    }
  }

  async removeMemberFromChannel(channelId: string, memberId: string): Promise<void> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);
      const channelSnapshot = await getDoc(channelRef);
  
      if (!channelSnapshot.exists()) {
        this.infoService.createInfo(`Kanal mit ID ${channelId} existiert nicht.`, true);
        return;
      }
  
      const channelData = channelSnapshot.data();
      const updatedMemberIds = (channelData?.['memberIds'] || []).filter(
        (id: string) => id !== memberId
      );
  
      await updateDoc(channelRef, {
        memberIds: updatedMemberIds,
      });
  
      this.infoService.createInfo(
        `Mitglied erfolgreich aus Kanal entfernt.`,
        false
      );
    } catch (error) {
      this.infoService.createInfo(
        `Fehler beim Entfernen des Mitglieds: ${(error as any).message}`,
        true
      );
      throw error;
    }
  }
  
  
}
