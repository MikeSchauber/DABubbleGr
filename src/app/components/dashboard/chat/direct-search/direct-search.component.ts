import { Component } from '@angular/core';
import { SearchService } from '../../../../core/services/search.service';
import { ChannelService } from '../../../../core/services/channel.service';
import { ProfileService } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-direct-search',
  standalone: true,
  imports: [],
  templateUrl: './direct-search.component.html',
  styleUrl: './direct-search.component.scss',
})
export class DirectSearchComponent {
  constructor(
    public searchService: SearchService,
    public profileService: ProfileService, 
    public channelService: ChannelService,
  ) {}
}
