import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelListComponent } from './channel-list/channel-list.component';
import { DirectMessagesComponent } from './direct-messages/direct-messages.component';
import { FormsModule } from '@angular/forms';
import { PopupManagerComponent } from '../../channel/popup-manager/popup-manager.component';
import { ChannelService } from '../../../core/services/channel.service';
import { ProfileService } from '../../../core/services/profile.service';
import { HeaderComponent } from '../header/header.component';
import { User } from '../../../models/interfaces/user.interface';
import { Subject, takeUntil } from 'rxjs';
import { SearchComponent } from '../search/search.component';
import { MobileControlService } from '../../../core/services/mobile-control.service';
import { InfoFlyerService } from '../../../core/services/info-flyer.service';
import { SearchService } from '../../../core/services/search.service';

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
    PopupManagerComponent,
    SearchComponent,
  ],
})
export class SidenavComponent implements OnInit, OnDestroy {
  //Roman neu:
  private destroy$ = new Subject<void>();

  /**
   * Emits the ID of the chat to open in the parent component.
   */
  @Output() openNewChat = new EventEmitter<string>();

  /** ID of the current chat */
  messageId: string | null = null;

  /** Search query entered by the user */
  searchQuery = '';

  /** Determines if the current view is mobile */
  isMobileView = window.innerWidth <= 950;

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
  users: {
    name: string;
    avatar: string;
    userStatus: 'online' | 'away' | 'offline';
    authId: string;
  }[] = [];

  constructor(
    private channelService: ChannelService,
    public profileService: ProfileService,
    public mobileService: MobileControlService,
    private inforService: InfoFlyerService,
    public searchService: SearchService
  ) {}

  /**
   * Updates the `isMobileView` state on window resize.
   */
  @HostListener('window:resize', [])
  onResize() {
    this.isMobileView = window.innerWidth <= 950;
  }

  /**
   * Initializes the component and subscribes to channel data from the service.
   */
  // ngOnInit(): void {
  //   this.channelService.channels$.subscribe((channels) => {
  //     this.channelsWithId = channels.map((channel) => ({
  //       id: channel.channelId,
  //       name: channel.name,
  //       members: channel.memberIds || [],
  //     }));
  //   });
  // }
  ///subscription life cycle wird beendet, um Memory Leaks zu verhindern.
  ngOnInit(): void {
    this.channelService.channels$
      .pipe(takeUntil(this.destroy$))
      .subscribe((channels) => {
        this.channelsWithId = channels.map((channel) => ({
          id: channel.channelId,
          name: channel.name,
          members: channel.memberIds || [],
        }));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        const channelId = await this.channelService.createChannel(
          data.name,
          data.description
        );
        this.openPopup('addMembers', { channelId, channelName: data.name });
      } catch (error) {
        this.inforService.createInfo(
          'Error creating channel. Please try again.',
          true
        );
      }
    } else if (this.currentPopup === 'addMembers') {
      const { channelId, memberIds } = data;
      if (!channelId || !memberIds) {
        console.error('Invalid channelId or memberIds:', {
          channelId,
          memberIds,
        });
        return;
      }
      try {
        await this.channelService.addMembersToChannel(channelId, memberIds);
        this.channelService.displayChannel(channelId);
        this.closePopup();
      } catch (error) {
        this.inforService.createInfo('Error adding members:', true);
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
   * Opens a chat by ID or creates a new one if no ID is provided.
   * @param threadId - The ID of the thread to open.
   */
  openChat(messageId: string | null): void {
    if (!messageId) {
      messageId = this.createNewThread();
    }
    this.openNewChat.emit(messageId);
    this.openNewMessage();
    this.mobileService.openChat();
  }

  /**
   * Creates a new thread ID.
   * @returns The newly generated thread ID.
   */
  private createNewThread(): string {
    const newThreadId = `thread-${Math.random().toString(36).substr(2, 9)}`;
    return newThreadId;
  }

  openNewMessage() {
    this.channelService.setCurrentChannel('newMessage');
  }
}
