import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Channel } from '../../models/channel.model.class';


@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private channelsSubject = new BehaviorSubject<Channel[]>([]);
  channels$ = this.channelsSubject.asObservable();


  ///Neu von Roman
  private currentChannelSubject = new BehaviorSubject<Channel | null>(null);
  currentChannel$ = this.currentChannelSubject.asObservable();

  ////for offline rendering...
  channels: any;

  constructor(private firestore: Firestore) {
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

  // Lädt die bestehenden Kanäle aus Firestore
  private async loadChannels() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'channels'));
      const channels: Channel[] = querySnapshot.docs.map(doc =>
        Channel.fromFirestoreData(doc.data(), doc.id) // Nutze `fromFirestoreData`
      );
      this.channelsSubject.next(channels); // Setzt die initiale Kanalliste
    } catch (error) {
      console.error('Fehler beim Laden der Kanäle:', error);
    }
  }

  // Erstellt einen neuen Kanal
  async createChannel(name: string, description: string): Promise<void> {
    try {
      const docRef = await addDoc(collection(this.firestore, 'channels'), {
        name: name,
        description: description,
        createdBy: 'currentUser', // Beispiel: Ersetze dies mit tatsächlichem Benutzer
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const newChannel: Channel = new Channel(
        docRef.id, // Firestore generiert die ID
        name,
        'currentUser', // Beispiel: Ersetze dies mit tatsächlichem Benutzer
        new Date(),
        new Date(),
        description
      );

      this.channelsSubject.next([...this.channelsSubject.value, newChannel]);
      console.log(`Channel created with ID: ${docRef.id}`);
    } catch (error) {
      console.error('Fehler beim Erstellen des Kanals: ', error);
      throw error;
    }
  }







  //Neu von Roman
  setCurrentChannel(channel: Channel) {
    this.currentChannelSubject.next(channel);
  }

  
}