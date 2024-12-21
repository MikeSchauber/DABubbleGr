/**
 * @fileoverview Service for managing thread functionality in the application.
 * Handles thread message creation, updates, and real-time synchronization with Firestore.
 * Thread messages are organized under parent messages to create conversation chains.
 *
 * @requires @angular/core
 * @requires @angular/fire/firestore
 * @requires rxjs
 */
import { Injectable, OnDestroy } from '@angular/core';
import { IMessage } from '../../models/interfaces/message2interface';
import {
  collection,
  collectionData,
  doc,
  Firestore,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import {
  BehaviorSubject,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThreadService implements OnDestroy {
  /** @private Subject for handling component cleanup */
  private destroy$ = new Subject<void>();

  /** @private BehaviorSubject maintaining the current thread ID */
  private currentThreadIdSubject = new BehaviorSubject<string | null>(null);

  /** @public Observable stream of the current thread ID */
  currentThreadId$ = this.currentThreadIdSubject.asObservable();

  /**
   * @public Observable stream of messages for the current thread
   * Automatically updates when the current thread changes
   * Uses shareReplay to cache the latest messages and prevent multiple subscriptions
   */
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

  /**
   * @constructor
   * @param {Firestore} firestore - The Firestore instance for database operations
   */
  constructor(private firestore: Firestore) {}

  /**
   * Performs cleanup when the service is destroyed
   * Completes all active observables to prevent memory leaks
   * @returns {void}
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.currentThreadIdSubject.complete();
  }

  /**
   * Sets the current active thread
   * Updates the currentThreadIdSubject with the new thread ID
   * @param {string} threadId - The ID of the thread to set as current
   * @returns {void}
   */
  setCurrentThread(threadId: string) {
    this.currentThreadIdSubject.next(threadId);
  }

  /**
   * Retrieves messages for a specific thread with real-time updates
   * Creates a query filtered by threadId and ordered by timestamp
   * @param {string} messageId - The ID of the parent message (serves as threadId)
   * @returns {Observable<IMessage[]>} Observable stream of thread messages
   */
  getMessagesForThread(messageId: string): Observable<IMessage[]> {
    const messagesCollection = collection(this.firestore, 'messages');
    const threadQuery = query(
      messagesCollection,
      where('threadId', '==', messageId),
      orderBy('timestamp', 'asc')
    );
    return collectionData(threadQuery) as Observable<IMessage[]>;
  }

  /**
   * Posts a new message to a thread and updates the parent message's metadata
   * Creates a new message document and increments the thread message count
   * @param {string} threadId - The ID of the thread (parent message ID)
   * @param {string} senderId - The ID of the user sending the message
   * @param {string} content - The content of the message
   * @returns {Promise<void>}
   * @throws {Error} If there's an error posting the message or updating the parent
   */
  async postThreadMessage(
    threadId: string,
    senderId: string,
    content: string
  ): Promise<void> {
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
      await setDoc(messageDocRef, newMessage);
      await this.updateParentMessageThreadInfo(threadId, 1);
    } catch (error) {
      console.error('Error in thread message operation:', error);
      throw error;
    }
  }

  /**
   * Updates the parent message's thread information
   * Increments the thread message count and updates the last message timestamp
   * @param {string} parentMessageId - The ID of the parent message
   * @param {number} incrementValue - The value to increment the message count by
   * @returns {Promise<void>}
   * @throws {Error} If there's an error updating the parent message
   */
  async updateParentMessageThreadInfo(
    parentMessageId: string,
    incrementValue: number
  ) {
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
