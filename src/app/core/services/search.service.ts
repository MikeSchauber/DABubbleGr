import { Injectable, OnInit } from '@angular/core';
import { CloudService } from './cloud.service';
import { UserClass } from '../../models/user-class.class';
import { Channel } from '../../models/channel.model.class';
import { ChannelService } from './channel.service';

import { User } from '../../models/interfaces/user.interface';
import { MemberService } from './member.service';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  membersSearch: boolean = false;
  searchQuery: string = '';
  directSearchQuery: string = '';
  userResults: UserClass[] = [];
  channelResults: Channel[] = [];
  members: User[] = [];

  constructor(
    private cloudService: CloudService,
    private channelService: ChannelService,
    private memberService: MemberService
  ) {}

  async onSearch() {
    const query = this.getActiveQuery();
    await this.searchItems('publicUserData', query);
    this.channelResults = this.filterResults(
      this.channelService.channelsSubject.value,
      query
    );
  }

  async onSearchDirect() {
    const query = this.directSearchQuery.trim();
    if (query.startsWith('#'))
      await this.searchChannels(query.substring(1).trim());
    else if (query.startsWith('@'))
      await this.searchUsers(query.substring(1).trim());
    else await this.searchAll(query);
  }

  async searchItems(ref: string, searchTerm: string) {
    const results = await this.cloudService.getCollection(ref);
    this.userResults = this.filterResults(results, searchTerm);
  }

  async searchChannels(searchTerm: string) {
    this.channelResults = this.filterResults(
      this.channelService.channelsSubject.value,
      searchTerm
    );
    this.userResults = [];
  }

  async searchUsers(searchTerm: string) {
    const results = await this.cloudService.getCollection('publicUserData');
    this.userResults = this.filterResults(results, searchTerm);
    this.channelResults = [];
  }

  async searchAll(searchTerm: string) {
    await this.searchItems('publicUserData', searchTerm);
    this.channelResults = this.filterResults(
      this.channelService.channelsSubject.value,
      searchTerm
    );
  }

  filterResults(results: any[], searchTerm: string) {
    return results.filter((doc) =>
      Object.entries(doc).some(
        ([key, value]) =>
          key !== 'avatarUrl' &&
          value?.toString()?.toLowerCase()?.includes(searchTerm.toLowerCase())
      )
    );
  }

  getActiveQuery() {
    return this.searchQuery.length ? this.searchQuery : this.directSearchQuery;
  }

  selectChannel(channelId: string) {
    this.channelService.setCurrentChannel(channelId);
    this.closeSearch();
  }

  toggleMembers(event: MouseEvent) {
    event.stopPropagation();
    this.membersSearch = !this.membersSearch;
  }

  closeSearch() {
    this.searchQuery = '';
    this.directSearchQuery = '';
    this.userResults = [];
    this.channelResults = [];
    this.membersSearch = false;
  }
}
