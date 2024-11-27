import { Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  QuerySnapshot,
} from '@angular/fire/firestore';
import { initializeApp } from 'firebase/app';
import { DocumentData, getFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environments';
import { UserClass } from '../../models/user-class.class';

@Injectable({
  providedIn: 'root',
})
export class CloudService implements OnDestroy {
  public app = initializeApp(environment);
  private firestore: Firestore;
  db = getFirestore();

  loading: boolean = false;
  publicUserData: UserClass[] = [];

  unsubPublicUserData;

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
        if (ref === 'publicUserData') {
          this.publicUserData = this.pushIntoEachArray(querySnapshot);
        }
        this.loading = false;
      },
      (error) => {
        console.error('Error getting documents: ', error);
        this.loading = false;
      }
    );
  }

  pushIntoEachArray(querySnapshot: QuerySnapshot) {
    let arrayData: any[] = [];
    querySnapshot.forEach((e) => {
      let data = e.data();
      arrayData.push(data);
    });
    console.log(typeof arrayData);
    
    return arrayData;
  }

  getRef(ref: string) {
    return collection(this.firestore, ref);
  }

  getRefForAddData(ref: string) {
    return collection(this.db, ref);
  }

  getSingleDoc(ref: string, docId: string) {
    return doc(this.firestore, ref, docId);
  }
}
