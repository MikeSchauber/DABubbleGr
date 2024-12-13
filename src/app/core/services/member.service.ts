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

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  channelMembers$: Observable<User[]>;

  constructor(
    private firestore: Firestore,
    private channelService: ChannelService,
    private userService: UserService
  ) {
    // this.channelMembers$ = combineLatest([
    //   this.channelService.currentChannel$,
    //   this.userService.publicUsers$,
    // ]).pipe(
    //   map(([channel, users]) => {
    //     console.log('CombineLatest Emitted:', { channel, users });
    //     if (!channel || !users) return [];
    //     const memberIds = channel.memberIds || [];
    //     // Filter users to only include channel members
    //     return users.filter((user) => memberIds.includes(user.publicUserId));
    //   }),
    //   shareReplay(1)
    // );

    // this.channelMembers$ = combineLatest([
    //   this.channelService.currentChannel$.pipe(distinctUntilChanged()),
    //   this.userService.publicUsers$.pipe(distinctUntilChanged()),
    // ]).pipe(
    //   map(([channel, users]) => {
    //     if (!channel || !users) return [];
    //     const memberIds = channel.memberIds || [];
    //     return users.filter((user) => memberIds.includes(user.publicUserId));
    //   }),
    //   shareReplay(1)
    // );
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
   * Fügt ein einzelnes Mitglied zu einem Kanal hinzu.
   * @param channelId Die ID des Kanals
   * @param memberId Die ID des Mitglieds
   */
  async addMemberToChannel(channelId: string, memberId: string): Promise<void> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);
      await updateDoc(channelRef, {
        memberIds: arrayUnion(memberId),
      });
      console.log(
        `Mitglied ${memberId} erfolgreich zu Kanal ${channelId} hinzugefügt.`
      );
    } catch (error) {
      console.error(
        `Fehler beim Hinzufügen von Mitglied ${memberId} zu Kanal ${channelId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Fügt mehrere Mitglieder zu einem Kanal hinzu.
   * @param channelId Die ID des Kanals
   * @param memberIds Eine Liste von Mitglieder-IDs
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

      console.log(
        `Mitglieder ${memberIds.join(
          ', '
        )} erfolgreich zu Kanal ${channelId} hinzugefügt.`
      );
    } catch (error) {
      console.error(
        `Fehler beim Hinzufügen von Mitgliedern zu Kanal ${channelId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Ruft alle Mitglieder eines Kanals ab.
   * @param channelId Die ID des Kanals
   * @returns Eine Liste von Mitglieder-IDs
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
   * Aktualisiert den Avatar eines Mitglieds.
   * @param memberId Die ID des Mitglieds
   * @param newAvatarUrl Die neue Avatar-URL
   */
  async updateMemberAvatar(
    memberId: string,
    newAvatarUrl: string
  ): Promise<void> {
    try {
      const memberRef = doc(this.firestore, 'publicUserData', memberId);
      await updateDoc(memberRef, { avatarUrl: newAvatarUrl });
      console.log(`Avatar von Mitglied ${memberId} erfolgreich aktualisiert.`);
    } catch (error) {
      console.error(
        `Fehler beim Aktualisieren des Avatars für Mitglied ${memberId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Ruft die Daten eines bestimmten Mitglieds ab.
   * @param memberId Die ID des Mitglieds
   * @returns Die Daten des Mitglieds oder `null`, falls nicht gefunden
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
          console.log(
            `Mitglied mit Namen ${memberId} gefunden:`,
            member.data()
          );
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
   * Ruft alle Mitglieder aus der `members`-Sammlung ab.
   * @returns Eine Liste von Mitgliedern mit ihren Daten
   */
  async fetchAllMembers(): Promise<any[]> {
    try {
      const membersCollection = collection(this.firestore, 'publicUserData');
      const querySnapshot = await getDocs(membersCollection);
      const members = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('Alle Mitglieder erfolgreich abgerufen:', members);
      return members;
    } catch (error) {
      console.error('Fehler beim Abrufen aller Mitglieder:', error);
      throw error;
    }
  }
}
