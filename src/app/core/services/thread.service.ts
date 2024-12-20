import { Injectable, OnDestroy } from '@angular/core';
import { Thread } from '../../models/interfaces/thread.interface';
import { IMessage } from '../../models/interfaces/message2interface';
import { collection, collectionData, doc, Firestore, getDocs, increment, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, of, shareReplay, Subject, switchMap, take, takeUntil, tap } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ThreadService implements OnDestroy {
  private destroy$ = new Subject<void>();

  private currentThreadIdSubject = new BehaviorSubject<string | null>(null);
  currentThreadId$ = this.currentThreadIdSubject.asObservable();

  // threadMessages$: Observable<IMessage[]>;


// Roman neu
// Move shareReplay outside of switchMap
threadMessages$: Observable<IMessage[]> = this.currentThreadId$.pipe(
  switchMap((threadId) => {
    if (threadId) {
      return this.getMessagesForThread(threadId);
    }
    return of([]);
  }),
  takeUntil(this.destroy$),
  shareReplay(1)
);



  constructor(private firestore: Firestore) { 

    // this.threadMessages$ = this.currentThreadId$.pipe(
    //   switchMap((threadId) => {
    //     if (threadId) {
    //       return this.getMessagesForThread(threadId).pipe(
           
    //         shareReplay(1) // Move shareReplay here
    //       );
    //     } else {
    //       return of([]);
    //     }
    //   })
    // );
  
    
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.currentThreadIdSubject.complete();
  }



 setCurrentThread(threadId: string) {
    this.currentThreadIdSubject.next(threadId);
    // console.log('Current thread ID set to: ', this.currentThreadIdSubject.value);
    // this.getMessagesForThread(threadId);
  }


  getMessagesForThread(messageId: string): Observable<IMessage[]> {
    const messagesCollection = collection(this.firestore, 'messages');
    const threadQuery = query(
      messagesCollection,
      where('threadId', '==', messageId),
      orderBy('timestamp', 'asc')
    );

    // console.log('Fetching messages for threadId:', messageId);

    return collectionData(threadQuery) as Observable<IMessage[]>;
  }





async postThreadMessage(threadId: string, senderId: string, content: string): Promise<void> {
  try {
    const messagesCollection = collection(this.firestore, 'messages');
    const messageDocRef = doc(messagesCollection);
    const newMessage = {
      messageId: messageDocRef.id,
      threadId: threadId,
      senderId: senderId,
      content: content.trim(),
      timestamp: serverTimestamp(),
    };

    // First post the new message
    await setDoc(messageDocRef, newMessage);
    
    // Then update the parent message's thread info
    await this.updateParentMessageThreadInfo(threadId, 1);
    
    // console.log('Thread message sent and parent updated');
  } catch (error) {
    console.error('Error in thread message operation:', error);
    throw error;
  }
}

async updateParentMessageThreadInfo(parentMessageId: string, incrementValue: number) {
  try {
    const parentMessageRef = doc(this.firestore, 'messages', parentMessageId);
    await updateDoc(parentMessageRef, {
      threadMessageCount: increment(incrementValue),
      lastThreadMessage: new Date(),
    });
  } catch (error) {
    console.error('Error updating parent message thread info:', error);
    throw error;
  }
}



}


