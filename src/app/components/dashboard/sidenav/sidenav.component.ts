import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelListComponent } from './channel-list/channel-list.component';
import { DirectMessagesComponent } from './direct-messages/direct-messages.component';
import { CreateChannelComponent } from '../../channel/create-channel/create-channel.component';
import { ChannelService } from '../../../core/services/channel.service';
import { Channel } from '../../../models/channel.model.class';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  imports: [FormsModule, CommonModule, ChannelListComponent],
}) 

export class SidenavComponent implements OnInit {
  isCreateChannelVisible: boolean = false;
  channelName: string = '';
  channelDescription: string = '';
  isChannelsExpanded: boolean = true;
  isDirectMessagesExpanded: boolean = true;


///////////////Roman Firebase integration - ersetze channelsWithId mit Firebase channel Daten für die child component "channel-list"
  channelsWithId = [
    { id: '1', name: 'General' },
    { id: '2', name: 'Marketing' },
    { id: '3', name: 'Development' },
  ];


  users = [
    { name: 'Frederik Beck', avatar: 'assets/basic-avatars/avatar1.svg' },
    { name: 'Anna Smith', avatar: 'assets/basic-avatars/avatar2.svg' },
  ];

  ngOnInit(): void {
    // Any initialization logic for the sidenav component
  }

  toggleChannels(): void {
    this.isChannelsExpanded = !this.isChannelsExpanded;
  }

  toggleDirectMessages(): void {
    this.isDirectMessagesExpanded = !this.isDirectMessagesExpanded;
  }

  createChannelPopup(): void {
    console.log('Create Channel Popup triggered'); // Debugging
    this.isCreateChannelVisible = true;
  }
  
  closeCreateChannel(): void {
    console.log('Closing Create Channel Popup'); // Debugging
    this.isCreateChannelVisible = false;
    this.resetChannelData();
  }
  
  createChannel(event: { name: string; description: string }): void {
    console.log('Creating Channel:', event.name, event.description);
    this.isCreateChannelVisible = false;
    this.resetChannelData();
  }
  
  private resetChannelData(): void {
    this.channelName = '';
    this.channelDescription = '';
  }
}  