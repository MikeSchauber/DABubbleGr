import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateChannelComponent } from '../../../channel/create-channel/create-channel.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-channel-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateChannelComponent],
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.scss'],
})
export class ChannelListComponent {
  @Input() channels: { name: string; id: string }[] = [];
  @Input() isChannelsExpanded: boolean = true;

  @Output() toggleChannels = new EventEmitter<void>();

  isCreateChannelVisible: boolean = false;
  isAddMembersVisible: boolean = false; // Necessary if you plan to implement member addition.
  channelName: string = '';
  channelDescription: string = '';
  isArrowHovered: boolean = false;

  // Toggles the visibility of the channel list
  onToggleChannels(): void {
    this.isChannelsExpanded = !this.isChannelsExpanded;
    this.toggleChannels.emit();
    console.log('Channel List: Toggle Channels. Now expanded:', this.isChannelsExpanded);
  }

  // Updates the channel name
  updateChannelName(newName: string): void {
    this.channelName = newName;
    console.log('Channel List: Updated channel name to', this.channelName);
  }

  // Updates the channel description
  updateChannelDescription(newDescription: string): void {
    this.channelDescription = newDescription;
    console.log('Channel List: Updated channel description to', this.channelDescription);
  }

  // Opens the "Create Channel" popup
  openCreateChannelPopup(): void {
    console.log('Channel List: Open Create Channel Popup');
    this.isCreateChannelVisible = true;
  }

  // Closes the "Create Channel" popup and resets the data
  closeCreateChannel(): void {
    console.log('Channel List: Close Create Channel Popup');
    this.isCreateChannelVisible = false;
    this.resetChannelData();
  }

  // Handles the creation of a new channel
  handleCreateChannel(event: { name: string; description: string }): void {
    console.log('Channel List: Creating channel with data:', event);

    // Add the new channel to the list
    const newChannel = {
      id: (Math.random() * 1000).toFixed(0), // Generate a random ID
      name: event.name.trim(),
      description: event.description.trim(),
    };

    if (newChannel.name.length < 3) {
      console.error('Channel name must be at least 3 characters.');
      return;
    }

    this.channels.push(newChannel);
    console.log('Channel List: New channel created:', newChannel);

    // Close the popup and reset data
    this.isCreateChannelVisible = false;
    this.resetChannelData();
  }

  // Resets channel data to default values
  private resetChannelData(): void {
    this.channelName = '';
    this.channelDescription = '';
    console.log('Channel List: Reset channel data.');
  }
}
