import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { CloudService } from './cloud.service';
import { UserClass } from '../../models/user-class.class';
import { Channel } from '../../models/channel.model.class';
import { ChannelService } from './channel.service';

@Injectable({
  providedIn: 'root', // Der Service wird global bereitgestellt
})
export class SearchService {
  searchQuery: string = '';
  directSearchQuery: string = '';
  userResults: UserClass[] = [];
  channelResults: Channel[] = [];

  constructor(
    private cloudService: CloudService,
    private channelService: ChannelService
  ) {}

  async onSearch() {
    try {
      this.userResults = await this.searchItems('publicUserData');
      this.channelResults = this.filterResults(this.channelService.channelsSubject.value);
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
    let query;
    if (this.searchQuery.length === 0) {
      query = this.directSearchQuery;
    } else {
      query = this.searchQuery;
    }
    return results.filter((doc) => {
      return Object.entries(doc).some(([key, value]) => {
        if (key === 'avatarUrl') return false;
        return value?.toString()?.toLowerCase()?.includes(query.toLowerCase());
      });
    });
  }

  closeSearch() {
    this.searchQuery = '';
    this.userResults = [];
    this.channelResults = [];
  }
}
