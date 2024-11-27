import { Injectable } from '@angular/core';
import { collectionData, Firestore, collection } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../models/interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private publicUsersSubject = new BehaviorSubject<User[] | null>([]);
  public publicUsers$ = this.publicUsersSubject.asObservable();

  constructor(private firestore: Firestore) { 
  this.loadPublicUserData();
  }

  /////Muss noch mit Auth verbunden werden...
  currentUserId: string = 'user1234';

  private loadPublicUserData() {
    const publicUserDataCollection = collection(this.firestore, 'publicUserDataClone');
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