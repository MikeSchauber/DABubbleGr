import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

interface Channel {
  id: string;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private channelsSubject = new BehaviorSubject<Channel[]>([]);
  channels$ = this.channelsSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.loadChannels(); // Lädt Kanäle aus Firestore beim Start
  }

  // Lädt die bestehenden Kanäle aus Firestore
  private async loadChannels() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'channels'));
      const channels: Channel[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data()['name'],
      }));
      this.channelsSubject.next(channels); // Setzt die initiale Kanalliste
    } catch (error) {
      console.error('Fehler beim Laden der Kanäle:', error);
    }
  }

  // Erstellt einen neuen Kanal und fügt ihn zur Kanalliste hinzu
  async createChannel(name: string, description: string): Promise<void> {
    try {
      const docRef = await addDoc(collection(this.firestore, 'channels'), {
        name: name,
        description: description,
        createdAt: new Date().toISOString(),
      });

      const newChannel: Channel = { id: docRef.id, name: name, description: description };
      this.channelsSubject.next([...this.channelsSubject.value, newChannel]);
      console.log(`Channel created with ID: ${docRef.id}`);
    } catch (error) {
      console.error('Fehler beim Erstellen des Kanals: ', error);
      throw error; 
    }
  }
}
