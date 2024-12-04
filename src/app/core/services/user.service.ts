import { Injectable, OnInit } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, map, shareReplay } from 'rxjs';
import { User } from '../../models/interfaces/user.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public publicUsers$: Observable<User[]>;
  // currentUserId: string = 'Hvk1x9JzzgSEls58gGFc';
  currentUserId: string = '';
  constructor(private firestore: Firestore) {
    this.publicUsers$ = this.loadPublicUserData();
  }

  private loadPublicUserData(): Observable<User[]> {
    const publicUserDataCollection = collection(
      this.firestore,
      'publicUserData'
    );
    return collectionData<User>(publicUserDataCollection, {
      idField: 'publicUserId',
    }).pipe(shareReplay(1));
  }

  // Create a map for user lookups by publicUserId
  getUserMap$(): Observable<Map<string, User>> {
    return this.publicUsers$.pipe(
      map((users) => {
        const userMap = new Map<string, User>();
        users.forEach((user) => {
          userMap.set(user.publicUserId, user);
        });
        return userMap;
      }),
      shareReplay(1)
    );
  }

  // Fetch all users from the Firestore collection
  getUsers(): Observable<User[]> {
    const publicUserDataCollection = collection(
      this.firestore,
      'publicUserDataClone'
    );
    return collectionData(publicUserDataCollection, { idField: 'id' }).pipe(
      map((users: any[]) =>
        users.map((user) => ({
          publicUserId: user.publicUserId,
          displayName: user.displayName,
          email: user.email,
          userStatus: user.userStatus, // Ensure this matches 'online', 'away', or 'offline'
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          // Map additional fields
          name: user.displayName,
          avatar: user.avatarUrl,
          authId: user.publicUserId,
          id: user.id, // Ensure 'id' exists in the collection or generate one
        }))
      )
    );
  }
}
