import { Injectable } from '@angular/core';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { collection } from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../models/user.class';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private publicUsersSubject = new BehaviorSubject<User[]>([]);
  public publicUsers$ = this.publicUsersSubject.asObservable();

  
  constructor(private firestore: Firestore) { 
  this.loadPublicUserData();

  }


  currentUserId: string = 'user1234';

  private loadPublicUserData() {
    const publicUserDataCollection = collection(this.firestore, 'publicUserData');
    const publicUserDataObservable = collectionData(publicUserDataCollection, { idField: 'publicUserId' }) as Observable<User[]>;
  
    publicUserDataObservable.subscribe({
      next: (publicUsers) => {
        this.publicUsersSubject.next(publicUsers);
        console.log('Fetched public user data:', publicUsers);
      },
      error: (error) => {
        console.error('Error fetching public user data:', error);
      }
    });
  }
}
