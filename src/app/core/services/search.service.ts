import { Injectable, OnInit } from '@angular/core';
import { CloudService } from './cloud.service';
import { UserClass } from '../../models/user-class.class';
import { Channel } from '../../models/channel.model.class';
import { ChannelService } from './channel.service';

import { User } from '../../models/interfaces/user.interface';
import { MemberService } from './member.service';
import { ChatService } from './chat.service';

@Injectable({
  providedIn: 'root',
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

/**
 * Performs a search based on the active query.
 * Results are filtered and stored in `userResults` and `channelResults`.
 * @async
 * @returns {Promise<void>} Resolves when the search process is complete.
 */
async onSearch() {
  const query = this.getActiveQuery();
  await this.searchItems('publicUserData', query);
  this.channelResults = this.filterResults(
    this.channelService.channelsSubject.value,
    query
  );
}

/**
 * Performs a direct search based on the input prefix.
 * - If the query starts with '#', it searches for channels.
 * - If the query starts with '@', it searches for users.
 * - Otherwise, it performs a general search for both users and channels.
 * @async
 * @returns {Promise<void>} Resolves when the search process is complete.
 */
async onSearchDirect() {
  const query = this.directSearchQuery.trim();
  if (query.startsWith('#'))
    await this.searchChannels(query.substring(1).trim());
  else if (query.startsWith('@'))
    await this.searchUsers(query.substring(1).trim());
  else await this.searchAll(query);
}

/**
 * Retrieves a collection of data from the cloud service and filters the results
 * based on the provided search term.
 * @async
 * @param {string} ref The reference name of the collection to search.
 * @param {string} searchTerm The term to filter the results by.
 * @returns {Promise<void>} Resolves when the search results are retrieved and filtered.
 */
async searchItems(ref: string, searchTerm: string) {
  try {
    const results = await this.cloudService.getCollection(ref);
    this.userResults = this.filterResults(results, searchTerm);
  } catch (error) {
    console.error(`Error retrieving data (${ref}):`, error);
    this.userResults = [];
  }
}

/**
 * Filters channels based on the provided search term.
 * Clears any previous user results.
 * @async
 * @param {string} searchTerm The term to filter channels by.
 * @returns {Promise<void>} Resolves when the channel results are filtered.
 */
async searchChannels(searchTerm: string) {
  this.channelResults = this.filterResults(
    this.channelService.channelsSubject.value,
    searchTerm
  );
  this.userResults = [];
}

/**
 * Retrieves user data from the 'publicUserData' collection and filters it
 * based on the provided search term.
 * Clears any previous channel results.
 * @async
 * @param {string} searchTerm The term to filter users by.
 * @returns {Promise<void>} Resolves when the user results are filtered.
 */
async searchUsers(searchTerm: string) {
  const results = await this.cloudService.getCollection('publicUserData');
  this.userResults = this.filterResults(results, searchTerm);
  this.channelResults = [];
}

/**
 * Performs a combined search to filter both user and channel data based on the search term.
 * @async
 * @param {string} searchTerm The term to filter results by.
 * @returns {Promise<void>} Resolves when both user and channel results are filtered.
 */
async searchAll(searchTerm: string) {
  await this.searchItems('publicUserData', searchTerm);
  this.channelResults = this.filterResults(
    this.channelService.channelsSubject.value,
    searchTerm
  );
}

/**
 * Filters a list of results based on a search term.
 * Fields like 'avatarUrl' are ignored during the filtering process.
 * @param {any[]} results The list of results to filter.
 * @param {string} searchTerm The term to filter the results by.
 * @returns {any[]} A filtered array of results matching the search term.
 */
filterResults(results: any[], searchTerm: string) {
  return results.filter((doc) =>
    Object.entries(doc).some(
      ([key, value]) =>
        key !== 'avatarUrl' &&
        value?.toString()?.toLowerCase()?.includes(searchTerm.toLowerCase())
    )
  );
}

/**
 * Returns the active query string.
 * If `searchQuery` has content, it is used; otherwise, `directSearchQuery` is returned.
 * @returns {string} The active search query.
 */
getActiveQuery() {
  return this.searchQuery.length ? this.searchQuery : this.directSearchQuery;
}

/**
 * Selects a channel by setting the current channel ID and closes the search panel.
 * @param {string} channelId The ID of the channel to select.
 * @returns {void}
 */
selectChannel(channelId: string) {
  this.channelService.setCurrentChannel(channelId);
  this.closeSearch();
}

/**
 * Closes the search panel and resets all search queries and results.
 * @returns {void}
 */
closeSearch() {
  this.searchQuery = '';
  this.directSearchQuery = '';
  this.userResults = [];
  this.channelResults = [];
}

}
