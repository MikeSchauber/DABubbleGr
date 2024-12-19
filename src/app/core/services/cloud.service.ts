import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  QuerySnapshot,
  getDocs,
  query,
  where,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class CloudService {
  loading: boolean = false;

  constructor(private firestore: Firestore) {}

  /** Saves the query snapshot data on the client side by extracting the data from each document.
   * @param {QuerySnapshot} querySnapshot - The query snapshot containing the documents.
   * @returns {any[]} An array of data extracted from the query snapshot. */
  saveOnClientSide(querySnapshot: QuerySnapshot) {
    let arrayData: any[] = [];
    querySnapshot.forEach((e) => {
      let data = e.data();
      arrayData.push(data);
    });
    return arrayData;
  }

  /** Retrieves a collection from Firestore and processes it on the client side.
   * @param {string} ref - The reference to the Firestore collection.
   * @returns {Promise<any[]>} A promise that resolves to an array of data from the collection. */
  async getCollection(ref: string) {
    let querySnapshot = await getDocs(collection(this.firestore, ref));
    return this.saveOnClientSide(querySnapshot);
  }

  /** Retrieves data from a Firestore collection based on a query filter.
   * @param {string} ref - The reference to the Firestore collection.
   * @param {string} field - The field name to query.
   * @param {any} value - The value to match in the query.
   * @returns {Promise<any[]>} A promise that resolves to an array of data matching the query. */
  async getQueryData(ref: string, field: string, value: any) {
    try {
      const q = query(
        collection(this.firestore, ref),
        where(field, '==', value)
      );
      const querySnapshot = await getDocs(q);
      return this.saveOnClientSide(querySnapshot);
    } catch (error) {
      console.error('Fehler beim Abrufen der Sammlung:', error);
      return [];
    }
  }

  /** Returns a reference to a Firestore collection.
   * @param {string} ref - The reference to the Firestore collection.
   * @returns {CollectionReference} A reference to the Firestore collection. */
  getRef(ref: string) {
    return collection(this.firestore, ref);
  }

  /** Returns a reference to a specific document in a Firestore collection.
   * @param {string} ref - The reference to the Firestore collection.
   * @param {string} docId - The ID of the document.
   * @returns {DocumentReference} A reference to the specific document. */
  getSingleDoc(ref: string, docId: string) {
    return doc(this.firestore, ref, docId);
  }

}
