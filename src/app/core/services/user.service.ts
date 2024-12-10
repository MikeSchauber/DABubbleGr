import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, map, shareReplay } from 'rxjs';
import { User } from '../../models/interfaces/user.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private publicUsersSubject = new BehaviorSubject<User[] | null>([]);
  public publicUsers$ = this.publicUsersSubject.asObservable();
  currentUserId: string = '';

  constructor(private firestore: Firestore,
              public authService: AuthService
  ) {
    this.loadPublicUserData();
    this.currentUserId = this.authService.currentUserData.publicUserId;
  }

  

  private loadPublicUserData() {
    const publicUserDataCollection = collection(this.firestore, 'publicUserData');
    const publicUserDataObservable = collectionData(publicUserDataCollection, { idField: 'publicUserId' }) as Observable<User[]>;

    publicUserDataObservable.subscribe({
      next: (publicUsers) => {
        this.publicUsersSubject.next(publicUsers);
        // console.log('Fetched public user data:', publicUsers);
      },
      error: (error) => {
        console.error('Error fetching public user data:', error);
      },
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

  // Fetch all users from the Firestore collection
  getUsers(): Observable<User[]> {
    const publicUserDataCollection = collection(this.firestore, 'publicUserData');
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
