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

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  // Mobile View Status
  @Input() isMobile: boolean = false;
  isMobileView: boolean = window.innerWidth <= 768;

  searchQuery: string = '';
  userResults: any[] = [];

  constructor(
    private firestore: Firestore,
    private cloudService: CloudService,
    public profileService: ProfileService,
    public authService: AuthService
  ) {}

  // Eventlistener für Fenstergröße
  @HostListener('window:resize', [])
  onResize() {
    this.isMobileView = window.innerWidth <= 768;
  }

  ngOnInit(): void {
    this.isMobileView = window.innerWidth <= 768; // Initial prüfen, ob Mobile View aktiv ist
  }

  HostListener(eventName: string, args: any[]): MethodDecorator {
    return AngularHostListener(eventName, args);
  }

  async onSearch(query: string) {
    this.userResults = await this.cloudService.searchUsers(query);

    try {

    } catch (error) {
      console.error('Error during search:', error);
    }
    console.log(this.userResults);
  }
}
