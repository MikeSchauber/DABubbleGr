import { Injectable } from '@angular/core';
import { collectionData, Firestore, collection } from '@angular/fire/firestore';
import { BehaviorSubject, map, Observable, shareReplay } from 'rxjs';
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
  currentUserId: string = 'v266QGISMa5W6fvBeBbD';

  private loadPublicUserData() {
    ////ACHTUNG HIER WIRD AKTUELL AUS DEM PUBLIC USER DATA CLONE GEFETCHT !!!
    ////ACHTUNG HIER WIRD AKTUELL AUS DEM PUBLIC USER DATA CLONE GEFETCHT !!!
    ////ACHTUNG HIER WIRD AKTUELL AUS DEM PUBLIC USER DATA CLONE GEFETCHT !!!
    const publicUserDataCollection = collection(this.firestore, 'publicUserDataClone');
    const publicUserDataObservable = collectionData(publicUserDataCollection, { idField: 'publicUserId' }) as Observable<User[]>;

    publicUserDataObservable.subscribe({
      next: (publicUsers) => {
        this.publicUsersSubject.next(publicUsers);
        // console.log('Fetched public user data:', publicUsers);
      },
      error: (error) => {
        console.error('Error fetching public user data:', error);
      }
    });
  }




  // Create a map for user lookups by publicUserId
  getUserMap$(): Observable<Map<string, User>> {
    return this.publicUsers$.pipe(
      map((users) => {
        const userMap = new Map<string, User>();
        users?.forEach((user) => {
          userMap.set(user.publicUserId, user);
        });
        return userMap;
      }),
      shareReplay(1)
    );
  }
}