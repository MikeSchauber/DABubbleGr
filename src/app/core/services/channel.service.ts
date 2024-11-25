import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc, collectionData } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Channel } from '../../models/channel.model.class';
import { MemberService } from './member.service';


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
      console.error('Fehler beim Erstellen des Kanals:', error);
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
  
}