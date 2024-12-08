import { Component } from '@angular/core';
import { SearchService } from '../../../core/services/search.service';
import { ChannelService } from '../../../core/services/channel.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  constructor(
    public searchService: SearchService,
    private channelService: ChannelService
  ) {}

  selectChannel(channelId: string) {
    // this.selectedChannelId = channelId;
    this.channelService.setCurrentChannel(channelId);
    this.searchService.closeSearch();
  }
}
