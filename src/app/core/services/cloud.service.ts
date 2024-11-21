import { inject, Injectable, OnDestroy } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc, onSnapshot, QuerySnapshot } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class CloudService implements OnDestroy {
  firestore: Firestore = inject(Firestore);
  loading: boolean = false;
  unsubChannels;
  unsubMembers;
  unsubIds;
  channels: any = [];
  members: any = [];
  memberPrivate: any = [];

  constructor() {
    this.unsubChannels = this.subList('channels');
    this.unsubMembers = this.subList('memberPrivate');
    this.unsubIds = this.subList('members');
  }

  ngOnDestroy(): void {
    this.unsubChannels();
    this.unsubMembers();
    this.unsubIds();
  }

  subList(ref: string) {
    return onSnapshot(this.getRef(ref), (querySnapshot) => {
      if (ref === 'channels') {
        this.channels =  this.addCollectionIdToData(querySnapshot)
      } else if (ref === 'members') {
        this.members =  this.addCollectionIdToData(querySnapshot)
      } else if (ref === 'memberPrivate') {
        this.memberPrivate =  this.addCollectionIdToData(querySnapshot)
      }
    });
  }

  addCollectionIdToData(querySnapshot: QuerySnapshot) {
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        collectionId: doc.id, 
      };
    });
  }

  getRef(ref: string) {
    return collection(this.firestore, ref);
  }

  getSingleRef(ref: string, docId: string) {
    return doc(collection(this.firestore, ref), docId);
  }
}
