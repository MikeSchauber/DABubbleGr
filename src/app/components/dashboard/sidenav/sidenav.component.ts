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

/**
 * @class SidenavComponent
 * @description Manages the application's side navigation bar, including channel lists, 
 *              direct messages, and mobile responsiveness.
 */
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
  /**
   * Emits the ID of the thread to open in the parent component.
   */
  @Output() openThreadBar = new EventEmitter<string>();

  /** ID of the current thread */
  threadId: string | null = null;

  /** Search query entered by the user */
  searchQuery = ''; 

  /** Determines if the current view is mobile */
  isMobileView = window.innerWidth <= 768;

  // State management for toggles
  /** Indicates if channels list is expanded */
  isChannelsExpanded = true;
  /** Indicates if direct messages list is expanded */
  isDirectMessagesExpanded = true;

  // Channel and popup state
  /** ID of the newly created channel */
  newChannelId: string | null = null;
  /** Name of the newly created channel */
  newChannelName: string = '';
  /** Current active popup type ('createChannel' or 'addMembers') */
  currentPopup: string | null = null;
  /** Data associated with the current popup */
  popupData: any = null;

  // Data lists
  /** List of channels with ID, name, and members */
  channelsWithId: { id: string; name: string; members: string[] }[] = [];
  /** List of users for direct messages */
  users: { name: string; avatar: string; userStatus: 'online' | 'away' | 'offline'; authId: string }[] = [];

  constructor(
    private channelService: ChannelService, 
    public profileService: ProfileService
  ) {}

  /**
   * Updates the `isMobileView` state on window resize.
   */
  @HostListener('window:resize', [])
  onResize() {
    this.isMobileView = window.innerWidth <= 768;
  }

  /**
   * Initializes the component and subscribes to channel data from the service.
   */
  ngOnInit(): void {
    this.channelService.channels$.subscribe((channels) => {
      this.channelsWithId = channels.map((channel) => ({
        id: channel.channelId,
        name: channel.name,
        members: channel.memberIds || [],
      }));
    });
  }

  /**
   * Toggles the visibility of the channels list.
   */
  toggleChannels(): void {
    this.isChannelsExpanded = !this.isChannelsExpanded;
  }

  /**
   * Toggles the visibility of the direct messages list.
   */
  toggleDirectMessages(): void {
    this.isDirectMessagesExpanded = !this.isDirectMessagesExpanded;
  }

  /**
   * Opens a popup with the specified type and optional data.
   * @param popupType - Type of the popup to open.
   * @param data - Additional data to pass to the popup.
   */
  openPopup(popupType: string, data: any = null): void {
    this.currentPopup = popupType;
    this.popupData = data;
    console.log('Popup opened:', { popupType, popupData: this.popupData });
  }

  /**
   * Closes the currently active popup.
   */
  closePopup(): void {
    this.currentPopup = null;
    this.popupData = null;
  }

  /**
   * Handles actions triggered by popups.
   * @param data - Data emitted from the popup action.
   */
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

  /**
   * Updates the search query based on user input.
   * @param event - The input event triggered by the search bar.
   */
  onSearch(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
  }

  /**
   * Opens a thread by ID or creates a new one if no ID is provided.
   * @param threadId - The ID of the thread to open.
   */
  openThread(threadId: string | null): void {
    if (!threadId) {
      threadId = this.createNewThread();
    }
    console.log('Opening thread with ID:', threadId);
    this.openThreadBar.emit(threadId);
  }

  /**
   * Creates a new thread ID.
   * @returns The newly generated thread ID.
   */
  private createNewThread(): string {
    const newThreadId = `thread-${Math.random().toString(36).substr(2, 9)}`;
    console.log('New thread created with ID:', newThreadId);
    return newThreadId;
  }
}
