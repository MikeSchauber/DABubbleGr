import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelService } from '../../../../core/services/channel.service';
import { Observable } from 'rxjs';
import { Channel } from '../../../../models/channel.model.class';
import { MobileControlService } from '../../../../core/services/mobile-control.service';

/**
 * @class ChannelListComponent
 * @description Displays and manages a list of channels, including the ability to toggle visibility, select channels, and create new channels.
 */
@Component({
  selector: 'app-channel-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.scss'],
})
export class ChannelListComponent {
  /** Indicates whether the arrow icon is hovered */
  isArrowHovered: boolean = true;

  /** List of channels passed from the parent component */
  @Input() channels: { name: string; id: string }[] = [];

  /** Indicates whether the channel list is expanded */
  @Input() isChannelsExpanded: boolean = true;

  /** Indicates if the mobile view is active */
  @Input() isMobileView: boolean = false;

  /** Emits an event to toggle the visibility of the channel list */
  @Output() toggleChannels = new EventEmitter<void>();

  /** Emits an event to open the "Create Channel" popup */
  @Output() openCreateChannel = new EventEmitter<void>();

  /** Visibility status of the "Create Channel" popup */
  isCreateChannelVisible: boolean = false;

  /** Visibility status of the "Add Members" popup */
  isAddMembersVisible: boolean = false;

  /** Name of the channel to be created */
  channelName: string = '';

  /** Description of the channel to be created */
  channelDescription: string = '';

  /** Observable for the list of channels */
  channels$: Observable<Channel[]>;

  constructor(
    public channelService: ChannelService,
    public mobileService: MobileControlService
  ) {
    this.channels$ = this.channelService.channels$;
  }

  /**
   * Selects a channel and updates the current channel in the service.
   * @param channelId - The ID of the channel to select.
   */
  selectChannel(channelId: string): void {
    this.mobileService.openChat();
    this.channelService.setCurrentChannel(channelId);
  }

  /**
   * Toggles the visibility of the channel list.
   */
  onToggleChannels(): void {
    this.toggleChannels.emit();
  }

  /**
   * Emits an event to open the "Create Channel" popup.
   */
  onOpenCreateChannel(): void {
    this.openCreateChannel.emit();
    // this.mobileService.openChat();
  }

  /**
   * Updates the name of the channel being created.
   * @param newName - The new name for the channel.
   */
  updateChannelName(newName: string): void {
    this.channelName = newName;
  }

  /**
   * Updates the description of the channel being created.
   * @param newDescription - The new description for the channel.
   */
  updateChannelDescription(newDescription: string): void {
    this.channelDescription = newDescription;
  }

  /**
   * Opens the "Create Channel" popup.
   */
  openCreateChannelPopup(): void {
    this.isCreateChannelVisible = true;
  }

  /**
   * Closes the "Create Channel" popup and resets channel data.
   */
  closeCreateChannel(): void {
    this.isCreateChannelVisible = false;
    this.resetChannelData();
  }

  /**
   * Handles the creation of a new channel using the service.
   * @param event - The data for the new channel, including name and description.
   */
  handleCreateChannel(event: { name: string; description: string }): void {
    if (event.name.trim().length < 3) {
      console.error('Channel name must be at least 3 characters.');
      return;
    }

    this.channelService
      .createChannel(event.name.trim(), event.description.trim())
      .then((createdChannelId) => {

        // Update the channel service's current channel
        this.channelService.setCurrentChannel(createdChannelId);

        // Optionally close the create channel popup
        this.isCreateChannelVisible = false;

        // Reset the input fields
        this.resetChannelData();
      })
      .catch((error) => {
        console.error('Error creating channel:', error);
      });
  }

  /**
   * Resets the channel name and description to their default values.
   */
  private resetChannelData(): void {
    this.channelName = '';
    this.channelDescription = '';
  }

  /**
   * Tracks channels by their unique ID for improved performance in *ngFor.
   */
  trackByChannelId(index: number, channel: any): string {
    return channel.channelId;
  }
}
