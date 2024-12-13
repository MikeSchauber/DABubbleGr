import { Component } from '@angular/core';
import { SearchService } from '../../../../core/services/search.service';

@Component({
  selector: 'app-members-search',
  standalone: true,
  imports: [],
  templateUrl: './members-search.component.html',
  styleUrl: './members-search.component.scss',
})
export class MembersSearchComponent {
  constructor(public searchService: SearchService) {}
}
