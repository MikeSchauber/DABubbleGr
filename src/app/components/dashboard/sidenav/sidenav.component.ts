import { Component, EventEmitter, Output, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelListComponent } from './channel-list/channel-list.component';
import { DirectMessagesComponent } from './direct-messages/direct-messages.component';
import { FormsModule } from '@angular/forms'; 
import { PopupManagerComponent } from '../../channel/popup-manager/popup-manager.component';
import { ChannelService } from '../../../core/services/channel.service'; 
import { ProfileService } from '../../../core/services/profile.service';
import { HeaderComponent } from '../header/header.component';
import { User } from '../../../models/interfaces/user.interface';


@Component({
  standalone: true,
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  imports: [
    FormsModule, 
    CommonModule, 
    ChannelListComponent, 
    DirectMessagesComponent,  
    HeaderComponent,
    PopupManagerComponent
  ],
})
export class SidenavComponent implements OnInit {
  @Output() openThreadBar = new EventEmitter<string>();

  threadId: string | null = null;

  searchQuery = ''; 
  isMobileView = window.innerWidth <= 768;

  // Listensteuerung
  isChannelsExpanded = true;
  isDirectMessagesExpanded = true;

// Aktueller Zustand
  newChannelId: string | null = null;
  newChannelName: string = '';

  // Popup-Steuerung
  currentPopup: string | null = null; // Aktives Popup ('createChannel' oder 'addMembers')
  popupData: any = null; // Daten für das aktuelle Popup

  // Listen
  channelsWithId: { id: string; name: string; members: string[] }[] = [];
  users: { name: string; avatar: string; userStatus: 'online' | 'away' | 'offline'; authId: string }[] = [];

  constructor(private channelService: ChannelService, public profileService: ProfileService) {}

  @HostListener('window:resize', [])
  onResize() {
    this.isMobileView = window.innerWidth <= 768;
  }

  ngOnInit(): void {
    this.channelService.channels$.subscribe((channels) => {
      this.channelsWithId = channels.map((channel) => ({
        id: channel.channelId,
        name: channel.name,
        members: channel.memberIds || [],
      }));
    });
  }

  // Toggle für Channel List
  toggleChannels(): void {
    this.isChannelsExpanded = !this.isChannelsExpanded;
  }

  // Toggle für Direct Messages
  toggleDirectMessages(): void {
    this.isDirectMessagesExpanded = !this.isDirectMessagesExpanded;
  }

  // Popup-Logik
  openPopup(popupType: string, data: any = null): void {
    this.currentPopup = popupType;
    this.popupData = data;
    console.log('Popup opened:', { popupType, popupData: this.popupData });
  }
  

  closePopup(): void {
    this.currentPopup = null;
    this.popupData = null;
  }

  async handlePopupAction(data: any): Promise<void> {
    if (this.currentPopup === 'createChannel') {
      try {
        const channelId = await this.channelService.createChannel(data.name, data.description);
        console.log('Channel created:', { channelId, name: data.name });
        this.openPopup('addMembers', { channelId, channelName: data.name });
      } catch (error) {
        console.error('Error creating channel:', error);
      }
    } else if (this.currentPopup === 'addMembers') {
      const { channelId, memberIds } = data;
      if (!channelId || !memberIds) {
        console.error('Invalid channelId or memberIds:', { channelId, memberIds });
        return;
      }
  
      try {
        await this.channelService.addMembersToChannel(channelId, memberIds);
        console.log('Members added successfully:', { channelId, memberIds });
        this.closePopup();
      } catch (error) {
        console.error('Error adding members:', error);
      }
    }
  }



  

  onSearch(event: Event): void {

    const inputElement = event.target as HTMLInputElement;

    this.searchQuery = inputElement.value;

  }

  openThread(threadId: string | null): void {
    if (!threadId) {
      threadId = this.createNewThread(); // Create a new thread if none exists
    }
    console.log('Opening thread with ID:', threadId);
    this.openThreadBar.emit(threadId); // Emit the threadId to the parent
  }

  private createNewThread(): string {
    // Logic to generate a new threadId (UUID or Firestore-generated ID)
    const newThreadId = `thread-${Math.random().toString(36).substr(2, 9)}`;
    console.log('New thread created with ID:', newThreadId);

    // Optionally, persist the thread in Firestore or a backend service here

    return newThreadId;
  }
}