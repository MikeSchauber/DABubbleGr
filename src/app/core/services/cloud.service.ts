import { Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  QuerySnapshot,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { UserClass } from '../../models/user-class.class';

@Injectable({
  providedIn: 'root',
})
export class CloudService implements OnDestroy {
  loading: boolean = false;
  publicUserData: UserClass[] = [];

  unsubPublicUserData;

  constructor(private firestore: Firestore) {
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
          this.publicUserData = this.saveOnClientSide(querySnapshot);
        }
        this.loading = false;
      },
      (error) => {
        console.error('Error getting documents: ', error);
        this.loading = false;
      }
    );
  }

  async searchUsers(searchValue: string) {
    try {
      const filteredResults = this.publicUserData.filter((doc) => {
        return Object.values(doc).some((value) =>
          value?.toString()?.toLowerCase()?.includes(searchValue.toLowerCase())
        );
      });
      return filteredResults;
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  }

  async searchItems(ref: string, searchValue: string) {
    try {
      const refCollection = this.getRef(ref);
      const querySnapshot = await getDocs(refCollection);
      const results = this.saveOnClientSide(querySnapshot);
      const filteredResults = results.filter((doc) => {
        return Object.values(doc) 
          .some((value) =>
            value
              ?.toString()
              ?.toLowerCase()
              ?.includes(searchValue.toLowerCase())
          );
      });
      return filteredResults;
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  }
  

  saveOnClientSide(querySnapshot: QuerySnapshot) {
    let arrayData: any[] = [];
    querySnapshot.forEach((e) => {
      let data = e.data();
      arrayData.push(data);
    });
    return arrayData;
  }

  getRef(ref: string) {
    return collection(this.firestore, ref);
  }

  getSingleDoc(ref: string, docId: string) {
    return doc(this.firestore, ref, docId);
  }
}
