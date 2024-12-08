import { Component, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../../core/services/search.service';
import { ProfileService } from '../../../core/services/profile.service';
import { HostListener as AngularHostListener } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileComponent } from '../../profile/profile.component';
import { Firestore } from '@angular/fire/firestore';
import { CloudService } from '../../../core/services/cloud.service';
import { Message } from '../../../models/interfaces/message.interface';
import { UserClass } from '../../../models/user-class.class';
import { Channel } from '../../../models/interfaces/channel.interace';
import { SearchComponent } from '../search/search.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileComponent, SearchComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  // Mobile View Status
  @Input() isMobile: boolean = false;
  isMobileView: boolean = window.innerWidth <= 950;

  searchQuery: string = '';

  constructor(
    public searchService: SearchService,
    public profileService: ProfileService,
    public authService: AuthService
  ) {}

   // Eventlistener für Fenstergröße
   @HostListener('window:resize', [])
   onResize() {
     this.isMobileView = window.innerWidth <= 950;
   }

   ngOnInit(): void {
    this.isMobileView = window.innerWidth <= 950; // Initial prüfen, ob Mobile View aktiv ist
    this.authService.loadCurrentUserDataFromLocalStorage();
  }

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
function HostListener(eventName: string, args: any[]): MethodDecorator {
  return AngularHostListener(eventName, args);
}

