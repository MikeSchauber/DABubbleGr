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
  unsubMembers;
  members: any = [];

  constructor(firestore: Firestore) {
    this.firestore = firestore;
    this.unsubMembers = this.subList('members');
  }

  ngOnDestroy(): void {
    if (this.unsubMembers) this.unsubMembers();
  }

  subList(ref: string) {
    return onSnapshot(this.getRef(ref), (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => doc.data());
      if (ref === 'members') {
        this.members = data;
      }
    });
  }

  getRef(ref: string) {
    return collection(this.firestore, ref);
  }

  getSingleDoc(ref: string, docId: string) {
    return doc(this.firestore, ref, docId);
  }
}
