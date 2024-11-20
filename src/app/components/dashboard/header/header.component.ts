import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditProfileComponent } from '../../profile/edit-profile/edit-profile.component';
import { SearchService } from '../../../core/services/search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, EditProfileComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent { 
  showPopup = false;
  // Variable für die Suchanfrage, die vom Eingabefeld gebunden wird
  searchQuery: string = '';

  // Array, das die Suchergebnisse speichert
  searchResults: any[] = [];

  constructor(private searchService: SearchService) {}

  // Aufruf der Suche bei Benutzereingaben
  onSearch(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;

    if (inputValue.startsWith('#') || inputValue.startsWith('@')) {
      this.searchService.searchTagsOrUsers(inputValue).then((results: any[]) => {
        this.searchResults = results;
      });
    } else {
      this.searchService.searchMessagesRealtime(inputValue, (results: any[]) => {
        this.searchResults = results;
      });
    }
  }

  // Auswahl eines Suchergebnisses
  selectResult(result: any): void {
    console.log('Selected Result:', result);
  }

  togglePopup() {
    this.showPopup = !this.showPopup;
  }
}