import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Channel } from '../../models/channel.model.class';
import { MemberService } from './member.service';
import { arrayUnion, getDoc } from 'firebase/firestore';


@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  // Observable für reaktive Kanallisten
  private channelsSubject = new BehaviorSubject<Channel[]>([]);
  channels$ = this.channelsSubject.asObservable();


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
   * Lädt bestehende Kanäle aus Firestore und aktualisiert das `BehaviorSubject`
   */
  private async loadChannels() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'channels'));
      const channels: Channel[] = querySnapshot.docs.map(doc =>
        Channel.fromFirestoreData(doc.data(), doc.id)
      );
      this.channelsSubject.next(channels); // Lokale Kanäle aktualisieren
    } catch (error) {
      console.error('Fehler beim Laden der Kanäle:', error);
    }
  }

  /**
   * Erstellt einen neuen Kanal und speichert ihn in Firestore
   * @param name Der Name des Kanals
   * @param description Die Beschreibung des Kanals (optional)
   * @returns Die ID des erstellten Kanals
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
      const createdBy = 'currentUser'; // Beispiel: AuthService.getCurrentUserId()
      const newChannelData = {
        name,
        description,
        createdBy,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        memberIds: [], // Initialisiere leere Mitgliederliste
      };

      // Erstelle das Dokument in Firestore
      const docRef = await addDoc(collection(this.firestore, 'channels'), newChannelData);

      // Aktualisiere das Dokument mit der generierten Firestore-ID
      await updateDoc(doc(this.firestore, 'channels', docRef.id), {
        channelId: docRef.id, 
      });

      // Lokales Channel-Objekt erstellen
      const newChannel = new Channel(
        docRef.id,
        name,
        createdBy,
        now,
        now,
        description,
        []
      );

      // Aktualisiere die lokale Kanalliste
      this.channelsSubject.next([...this.channelsSubject.value, newChannel]);

      console.log(`Channel created with ID: ${docRef.id}`);
      return docRef.id; // Gibt die ID des erstellten Kanals zurück
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
  async addMemberToChannel(channelId: string, memberIds: string) {
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
   * Entfernt ein Mitglied aus einem Kanal
   * @param channelId Die ID des Kanals
   * @param memberId Die ID des zu entfernenden Mitglieds
   */
  async removeMemberFromChannel(channelId: string, memberId: string): Promise<void> {
    try {
      const channelRef = doc(this.firestore, 'channels', channelId);
      const channelData = (await getDoc(channelRef)).data();

      if (!channelData?.['memberIds']?.includes(memberId)) {
        console.warn(`Mitglied ${memberId} ist nicht im Kanal ${channelId} vorhanden.`);
        return;
      }

      const updatedMembers = channelData['memberIds'].filter((id: string) => id !== memberId);
      await updateDoc(channelRef, { memberIds: updatedMembers });

      console.log(`Mitglied ${memberId} erfolgreich aus Kanal ${channelId} entfernt.`);
    } catch (error) {
      console.error('Fehler beim Entfernen des Mitglieds:', error);
      throw error;
    }
  }

  /**
   * Setzt den aktuellen Kanal, der vom Benutzer ausgewählt wurde
   * @param channel Der ausgewählte Kanal
   */
  setCurrentChannel(channel: Channel): void {
    this.currentChannelSubject.next(channel);
    console.log(`Aktueller Kanal gesetzt:`, channel);
  }
}
