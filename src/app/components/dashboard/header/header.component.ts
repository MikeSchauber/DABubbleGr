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
  userResults: UserClass[] = [];
  messagesResults: Message[] = [];
  channelResults: Channel[] = [];

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
    try {
      this.userResults = await this.searchItems('publicUserData', query);
      this.messagesResults = await this.searchItems('messages', query);
      this.channelResults = await this.searchItems('channels', query);
    } catch (error) {
      console.error('Error during search:', error);
    }
    console.log(this.userResults);
    console.log(this.messagesResults);
    console.log(this.channelResults);
  }

  async searchItems(ref: string, searchValue: string) {
    try {
      const results = await this.cloudService.getCollection(ref);
      const filteredResults = results.filter((doc) => {
        return Object.values(doc).some((value) =>
          value?.toString()?.toLowerCase()?.includes(searchValue.toLowerCase())
        );
      });
      return filteredResults;
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  }
}
