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

//   /**
//    * Öffnet oder schließt das Profil-Popup.
//    */
//   toggleProfilePopup(): void {
//     this.showProfilePopup = !this.showProfilePopup;
//   }

//  /**
//    * Öffnet die Profil-Details (ProfileComponent).
//    */
//  openProfileDetails(): void {
//   this.showProfilePopup = false; // Schließt das Haupt-Popup
//   this.showProfileDetails = true; // Öffnet die ProfileComponent
// }

// /**
//  * Schließt die Profil-Details.
//  */
// closeProfileDetails(): void {
//   this.showProfileDetails = false;
// }

/**
 * Loggt den Benutzer aus.
 */
logout(): void {
  console.log('Logging out...');
  window.location.href = 'index.html'; // Leitet zur Login-Seite weiter
}

  /**
   * Suchfunktion, die auf Benutzereingaben reagiert.
   * @param event - Das Eingabe-Event
   */
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

  /**
   * Auswahl eines Suchergebnisses.
   * @param result - Das ausgewählte Suchergebnis
   */
  selectResult(result: any): void {
    console.log('Selected Result:', result);
  }
}
