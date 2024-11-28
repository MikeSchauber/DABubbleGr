import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateChannelComponent } from '../../../channel/create-channel/create-channel.component';
import { FormsModule } from '@angular/forms';
import { ChannelService } from '../../../../core/services/channel.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-channel-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.scss'],
})
export class ChannelListComponent {
  isArrowHovered: boolean = false; // Zustand, ob der Pfeil angezeigt wird
  @Input() channels: { name: string; id: string }[] = []; // Kanäle von der Elternkomponente
  @Input() isChannelsExpanded: boolean = true; // Zustand, ob die Liste expandiert ist

  @Output() toggleChannels = new EventEmitter<void>(); // Event zum Umschalten der Liste
  @Output() openCreateChannel = new EventEmitter<void>(); // Event zum Öffnen des Popups

  isCreateChannelVisible: boolean = false;
  isAddMembersVisible: boolean = false; // Necessary if you plan to implement member addition.
  channelName: string = '';
  channelDescription: string = '';

  ////////////Roman Firebase integration

  channels$: Observable<{ channelId: string; name: string }[]>;
  constructor(private channelService: ChannelService) {
    this.channels$ = this.channelService.channels$;
  }

  selectChannel(channelId: string) {
    this.channelService.setCurrentChannel(channelId);
    // console.log('channel-list component - changed current channel to:' + channelId);
  }
  ////////////Roman ENDE

  // Toggles the visibility of the channel list
  onToggleChannels(): void {
    this.toggleChannels.emit();
  }

  // Öffnen des Popups zum Erstellen eines neuen Kanals
  onOpenCreateChannel(): void {
    this.openCreateChannel.emit();
  }
  // Updates the channel name
  updateChannelName(newName: string): void {
    this.channelName = newName;
    console.log('Channel List: Updated channel name to', this.channelName);
  }

  // Updates the channel description
  updateChannelDescription(newDescription: string): void {
    this.channelDescription = newDescription;
    console.log(
      'Channel List: Updated channel description to',
      this.channelDescription
    );
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
  // handleCreateChannel(event: { name: string; description: string }): void {
  //   console.log('Channel List: Creating channel with data:', event);

  //   // Add the new channel to the list
  //   const newChannel = {
  //     id: (Math.random() * 1000).toFixed(0), // Generate a random ID
  //     name: event.name.trim(),
  //     description: event.description.trim(),
  //   };

  //   if (newChannel.name.length < 3) {
  //     console.error('Channel name must be at least 3 characters.');
  //     return;
  //   }

  //   this.channels.push(newChannel);
  //   console.log('Channel List: New channel created:', newChannel);

  //   // Close the popup and reset data
  //   this.isCreateChannelVisible = false;
  //   this.resetChannelData();
  // }
  handleCreateChannel(event: { name: string; description: string }): void {
    // console.log('Channel List: Creating channel with data:', event);

    if (event.name.trim().length < 3) {
      console.error('Channel name must be at least 3 characters.');
      return;
    }

    this.channelService
      .createChannel(event.name.trim(), event.description.trim())
      .then(() => {
        // console.log('Channel List: New channel created');
        // Close the popup and reset data
        this.isCreateChannelVisible = false;
        this.resetChannelData();
      })
      .catch((error) => {
        console.error('Error creating channel:', error);
      });
  }

  // Resets channel data to default values
  private resetChannelData(): void {
    this.channelName = '';
    this.channelDescription = '';
    console.log('Channel List: Reset channel data.');
  }
}