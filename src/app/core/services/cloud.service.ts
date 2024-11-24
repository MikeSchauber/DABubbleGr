import { Injectable, OnDestroy } from '@angular/core';
import { Firestore, collection, doc, onSnapshot, QuerySnapshot } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class CloudService implements OnDestroy {
  private firestore: Firestore;
  loading: boolean = false;
  unsubChannels;
  unsubMembers;
  unsubIds;
  channels: any = [];
  members: any = [];
  memberPrivate: any = [];


  constructor(firestore: Firestore) {
    this.firestore = firestore;
    this.unsubChannels = this.subList('channels');
    this.unsubMembers = this.subList('memberPrivate');
    this.unsubIds = this.subList('members');
  }

  ngOnDestroy(): void {
    if (this.unsubChannels) this.unsubChannels();
    if (this.unsubMembers) this.unsubMembers();
    if (this.unsubIds) this.unsubIds();
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

  getSingleDoc(ref: string, docId: string) {
    return doc(this.firestore, ref, docId);
}

getSingleRef(collectionName: string, id: string) {

  return doc(this.firestore, collectionName, id);

}
 
}