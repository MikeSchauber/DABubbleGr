import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../../core/services/search.service';
import { ProfileComponent } from '../../profile/profile.component';
import { ProfileService } from '../../../core/services/profile.service';
import { LogoutDisplayComponent } from '../../profile/logout-display/logout-display.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileComponent, LogoutDisplayComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  // Variable für die Suchanfrage, die vom Eingabefeld gebunden wird
  searchQuery: string = '';

  // Array, das die Suchergebnisse speichert
  searchResults: any[] = [];

  constructor(private searchService: SearchService, public profileService: ProfileService) {}

  // Aufruf der Suche bei Benutzereingaben
  onSearch(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;

    if (inputValue.startsWith('#') || inputValue.startsWith('@')) {
      this.searchService
        .searchTagsOrUsers(inputValue)
        .then((results: any[]) => {
          this.searchResults = results;
        });
    } else {
      this.searchService.searchMessagesRealtime(
        inputValue,
        (results: any[]) => {
          this.searchResults = results;
        }
      );
    }
  }

  // Auswahl eines Suchergebnisses
  selectResult(result: any): void {
    console.log('Selected Result:', result);
  }
}
