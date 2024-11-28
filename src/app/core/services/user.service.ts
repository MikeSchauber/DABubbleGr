import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../models/user.class';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private publicUsersSubject = new BehaviorSubject<User[] | null>([]);
  public publicUsers$ = this.publicUsersSubject.asObservable();
  currentUserId: string = 'defaultUserId';

  constructor(private firestore: Firestore) {
    this.loadPublicUserData();
  }

  private loadPublicUserData() {
    const userCollection = collection(this.firestore, 'publicUserData');
    const userObservable = collectionData(userCollection, { idField: 'collectionId' });

    userObservable.subscribe({
      next: (users: any[]) => {
        // Konvertiere Firebase-Daten in `User`-Instanzen
        const userInstances: User[] = users.map((data: any) => {
          return new User(
            data.email || null,
            data.authId || '',
            data.displayName || null,
            data.userStatus || 'away', // Fallback auf 'away', falls nicht angegeben
            data.online || false,
            data.avatarUrl || '',
            data.createdAt ? new Date(data.createdAt) : new Date(), // Fallback auf aktuelles Datum
            data.updatedAt ? new Date(data.updatedAt) : new Date(), // Fallback auf aktuelles Datum
            data.collectionId || '',
            data.memberOfChannels || [],
            data.chatIds || []
          );
        });
        this.publicUsersSubject.next(userInstances);
        console.log('Loaded user instances:', userInstances);
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
      },
    });
  }
}  