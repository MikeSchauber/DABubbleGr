import { Component, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../../core/services/search.service';
import { ProfileService } from '../../../core/services/profile.service';
import { HostListener as AngularHostListener } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileComponent } from '../../profile/profile.component';
import { SearchComponent } from '../search/search.component';
import { MobileControlService } from '../../../core/services/mobile-control.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileComponent, SearchComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() isMobile: boolean = false;
  isMobileView: boolean = window.innerWidth <= 950;

  constructor(
    public searchService: SearchService,
    public profileService: ProfileService,
    public authService: AuthService,
    public mobileService: MobileControlService
  ) {}
  /** Listens for window resize events and adjusts the view accordingly.
   * Updates the isMobileView property based on window width. */
  @HostListener('window:resize', [])
  onResize() {
    this.isMobileView = window.innerWidth <= 950;
  }

  /** Initializes the component and checks if user data exists in localStorage.
   * If data is present, loads the current user data from localStorage. */
  async ngOnInit() {
    this.isMobileView = window.innerWidth <= 950;
    if (localStorage.getItem('currentUserData') !== null) {
      await this.authService.loadCurrentUserDataFromLocalStorage();
    }
  }

  /** Custom HostListener decorator to listen for specified events.
   * @param {string} eventName - The name of the event to listen for.
   * @param {any[]} args - The arguments to pass to the event handler. */
  HostListener(eventName: string, args: any[]): MethodDecorator {
    return AngularHostListener(eventName, args);
  }
}
