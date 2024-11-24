import { Injectable } from '@angular/core';
import { Firestore, addDoc, updateDoc, doc, arrayUnion, collection, getDocs, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  constructor(private firestore: Firestore) {}

  // Add a member to a channel
  async addMemberToChannel(channelId: string, memberId: string): Promise<void> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);
      await updateDoc(channelRef, {
        memberIds: arrayUnion(memberId),
      });
      console.log(`Member ${memberId} added to channel ${channelId}`);
    } catch (error) {
      console.error('Error adding member to channel:', error);
    }
  }

  // Fetch all members of a channel
  async getMembersOfChannel(channelId: string): Promise<string[]> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);
      const channelSnapshot = await getDoc(channelRef);
      const channelData = channelSnapshot.data();

      if (channelData?.['memberIds']) {
        return channelData['memberIds'] as string[];
      }
      return [];
    } catch (error) {
      console.error('Error fetching members of the channel:', error);
      return [];
    }
  }

  // Update a member's avatar
  async updateMemberAvatar(memberId: string, newAvatarUrl: string): Promise<void> {
    try {
      const memberRef = doc(this.firestore, 'members', memberId);
      await updateDoc(memberRef, { avatarUrl: newAvatarUrl });
      console.log(`Member ${memberId} avatar updated.`);
    } catch (error) {
      console.error('Error updating member avatar:', error);
    }
  }

  // Fetch a member by ID
  async getMemberById(memberId: string): Promise<any> {
    try {
      const memberRef = doc(this.firestore, 'members', memberId);
      const memberSnapshot = await getDoc(memberRef);
      return memberSnapshot.data();
    } catch (error) {
      console.error('Error fetching member:', error);
      return null;
    }
  }

  // Fetch all members in the 'members' collection
  async fetchAllMembers(): Promise<any[]> {
    try {
      const membersCollection = collection(this.firestore, 'members');
      const querySnapshot = await getDocs(membersCollection);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching members:', error);
      return [];
    }
  }
}
