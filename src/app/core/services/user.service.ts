import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { BehaviorSubject, map, Observable, shareReplay } from 'rxjs';
import { User } from '../../models/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private publicUsersSubject = new BehaviorSubject<User[] | null>([]);
  public publicUsers$ = this.publicUsersSubject.asObservable();

  constructor(private firestore: Firestore) { 
  this.loadPublicUserData();
  }

  /////Muss noch mit Auth verbunden werden...
   currentUserId: string = 'Hvk1x9JzzgSEls58gGFc';

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


  // private loadPublicUserData() {
  //   const userCollection = collection(this.firestore, 'publicUserData');
  //   const userObservable = collectionData(userCollection, { idField: 'collectionId' });

  //   userObservable.subscribe({
  //     next: (users: any[]) => {
  //       // Konvertiere Firebase-Daten in `User`-Instanzen
  //       const userInstances: User[] = users.map((data: any) => {
  //         return new User(
  //           data.email || null,
  //           data.authId || '',
  //           data.displayName || null,
  //           data.userStatus || 'away', // Fallback auf 'away', falls nicht angegeben
  //           data.online || false,
  //           data.avatarUrl || '',
  //           data.createdAt ? new Date(data.createdAt) : new Date(), // Fallback auf aktuelles Datum
  //           data.updatedAt ? new Date(data.updatedAt) : new Date(), // Fallback auf aktuelles Datum
  //           data.collectionId || '',
  //           data.memberOfChannels || [],
  //           data.chatIds || []
  //         );
  //       });
  //       this.publicUsersSubject.next(userInstances);
  //       console.log('Loaded user instances:', userInstances);
  //     },
  //     error: (error: any) => {
  //       console.error('Error loading users:', error);
  //     },
  //   });
  // }
}  