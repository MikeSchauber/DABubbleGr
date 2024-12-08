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

  saveOnClientSide(querySnapshot: QuerySnapshot) {
    let arrayData: any[] = [];
    querySnapshot.forEach((e) => {
      let data = e.data();
      arrayData.push(data);
    });
    return arrayData;
  }

  async getCollection(ref: string) {
    let querySnapshot = await getDocs(collection(this.firestore, ref));
    return this.saveOnClientSide(querySnapshot);
  }

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

  getRef(ref: string) {
    return collection(this.firestore, ref);
  }

  getSingleDoc(ref: string, docId: string) {
    return doc(this.firestore, ref, docId);
  }
}
