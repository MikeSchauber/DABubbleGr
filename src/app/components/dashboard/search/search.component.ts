import { Component } from '@angular/core';
import { SearchService } from '../../../core/services/search.service';
import { ChannelService } from '../../../core/services/channel.service';
import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  searchQuery: string = '';
  
  constructor(
    public searchService: SearchService,
    private channelService: ChannelService,
    public profileService: ProfileService
  ) {}

  selectChannel(channelId: string) {
    // this.selectedChannelId = channelId;
    this.channelService.setCurrentChannel(channelId);
    this.searchService.closeSearch();
  }
}
