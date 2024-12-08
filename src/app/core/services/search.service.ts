import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from '@angular/fire/firestore';
import { CloudService } from './cloud.service';
import { UserClass } from '../../models/user-class.class';
import { Message } from '../../models/interfaces/message.interface';
import { Channel } from '../../models/interfaces/channel.interace';

@Injectable({
  providedIn: 'root', // Der Service wird global bereitgestellt
})
export class SearchService {
  searchQuery: string = '';
  userResults: UserClass[] = [];
  channelResults: Channel[] = [];

  constructor(
    private firestore: Firestore,
    private cloudService: CloudService
  ) {}

  async onSearch() {
    try {
      this.userResults = await this.searchItems('publicUserData');
      this.channelResults = await this.searchItems('channels');
    } catch (error) {
      console.error('Error during search:', error);
    }
  }

  async searchItems(ref: string) {
    try {
      const results = await this.cloudService.getCollection(ref);
      const filteredResults = this.filterResults(results);
      return filteredResults;
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }

  }

  filterResults(results: any[]) {
    return results.filter((doc) => {
      return Object.entries(doc).some(([key, value]) => {
        if (key === 'avatarUrl') return false;
        return value
          ?.toString()
          ?.toLowerCase()
          ?.includes(this.searchQuery.toLowerCase());
      });
    });
  }

  closeSearch() {
    this.searchQuery = '';
    this.userResults = [];
    this.channelResults = [];
  }
}
