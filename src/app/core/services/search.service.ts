import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, onSnapshot } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root' // Der Service wird global bereitgestellt
})
export class SearchService {
  constructor(private firestore: Firestore) {}

  /**
   * Sucht nach Nachrichten in Firestore basierend auf dem Suchstring.
   * @param queryText - Die Eingabe des Benutzers.
   * @returns Ein Array mit den gefundenen Nachrichten.
   */
  async searchMessages(queryText: string): Promise<any[]> {
    if (queryText.trim() === '') return [];

    const messagesRef = collection(this.firestore, 'messages');
    const messagesQuery = query(
      messagesRef,
      where('content', '>=', queryText),
      where('content', '<=', queryText + '\uf8ff')
    );

    const querySnapshot = await getDocs(messagesQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Echtzeit-Suche für Nachrichten in Firestore.
   * @param queryText - Die Eingabe des Benutzers.
   * @param callback - Eine Callback-Funktion, um Ergebnisse zurückzugeben.
   */
  searchMessagesRealtime(queryText: string, callback: (results: any[]) => void): void {
    if (queryText.trim() === '') {
      callback([]);
      return;
    }

    const messagesRef = collection(this.firestore, 'messages');
    const messagesQuery = query(
      messagesRef,
      where('content', '>=', queryText),
      where('content', '<=', queryText + '\uf8ff')
    );

    onSnapshot(messagesQuery, (querySnapshot) => {
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(results);
    });
  }

  /**
   * Sucht nach Tags oder Benutzern basierend auf der Eingabe.
   * @param queryText - Der Suchstring (z. B. "#Tag" oder "@Benutzer").
   * @returns Ein Array mit passenden Ergebnissen.
   */
  async searchTagsOrUsers(queryText: string): Promise<any[]> {
    if (queryText.startsWith('#')) {
      const tagsRef = collection(this.firestore, 'tags');
      const tagsQuery = query(
        tagsRef,
        where('name', '>=', queryText.slice(1)),
        where('name', '<=', queryText.slice(1) + '\uf8ff')
      );

      const querySnapshot = await getDocs(tagsQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } else if (queryText.startsWith('@')) {
      const usersRef = collection(this.firestore, 'users');
      const usersQuery = query(
        usersRef,
        where('username', '>=', queryText.slice(1)),
        where('username', '<=', queryText.slice(1) + '\uf8ff')
      );

      const querySnapshot = await getDocs(usersQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    return [];
  }
}
