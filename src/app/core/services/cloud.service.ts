import { Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  QuerySnapshot,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class CloudService implements OnDestroy {
  private firestore: Firestore;
  loading: boolean = false;
  unsubPublicUserData;
  publicUserData: any = [];

  constructor(firestore: Firestore) {
    this.firestore = firestore;
    this.unsubPublicUserData = this.subList('publicUserData');
  }

  ngOnDestroy(): void {
    this.unsubPublicUserData();
  }

  subList(ref: string) {
    this.loading = true;
    return onSnapshot(
      this.getRef(ref),
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => doc.data());
        if (ref === 'publicUserData') {
          this.publicUserData = data;
        }
        this.loading = false;
      },
      (error) => {
        console.error('Error getting documents: ', error);
        this.loading = false;
      }
    );
  }

  getRef(ref: string) {
    return collection(this.firestore, ref);
  }

  getSingleDoc(ref: string, docId: string) {
    return doc(this.firestore, ref, docId);
  }
}
