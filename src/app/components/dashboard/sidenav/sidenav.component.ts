import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelListComponent } from './channel-list/channel-list.component';
import { DirectMessagesComponent } from './direct-messages/direct-messages.component';
import { FormsModule } from '@angular/forms';
import { CreateChannelComponent } from '../../channel/create-channel/create-channel.component';
import { AddMembersComponent } from '../../channel/add-members/add-members.component';
import { ChannelService } from '../../../core/services/channel.service';

interface User {
  name: string;
  avatar: string;
  userStatus: 'active' | 'away';
  authId: string;
}

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
    CreateChannelComponent, 
    AddMembersComponent,
  ],
})
export class SidenavComponent implements OnInit {
  // Kanalliste
  channelsWithId: { id: string; name: string; members: string[] }[] = [];

  // Popup-Steuerung
  isCreateChannelVisible = false;
  isAddMembersVisible = false;

  // Aktueller Zustand
  newChannelId: string | null = null;
  newChannelName: string = '';

  // Steuerung für die Listen
  isChannelsExpanded = true;
  isDirectMessagesExpanded = true;

  // Benutzerliste
  users: User[] = [
    { name: 'Frederik Beck', avatar: 'assets/basic-avatars/avatar1.svg', userStatus: 'active', authId: 'user123' },
    { name: 'Anna Smith', avatar: 'assets/basic-avatars/avatar2.svg', userStatus: 'away', authId: 'user456' },
  ];

  constructor(private channelService: ChannelService) {}

  ngOnInit(): void {
    // Abonniere die Kanäle aus dem Service
    this.channelService.channels$.subscribe((channels) => {
      this.channelsWithId = channels.map((channel) => ({
        id: channel.channelId,
        name: channel.name,
        members: channel.memberIds || [],
      }));
      // console.log('Aktualisierte Kanäle:', this.channelsWithId);
    });
  }

  // Öffnet/Schließt die Kanalliste
  toggleChannels(): void {
    this.isChannelsExpanded = !this.isChannelsExpanded;
  }

  // Öffnet/Schließt die Direct-Messages-Liste
  toggleDirectMessages(): void {
    this.isDirectMessagesExpanded = !this.isDirectMessagesExpanded;
  }

  // Öffnet das Create-Channel-Popup
  openCreateChannelPopup(): void {
    this.isCreateChannelVisible = true;
    this.isAddMembersVisible = false;
  }

  // Schließt das Create-Channel-Popup
  closeCreateChannelPopup(): void {
    this.isCreateChannelVisible = false;
  }

  // Erstellt einen neuen Kanal und öffnet das Add-Members-Popup
  async handleCreateChannel(newChannel: { name: string; description: string }): Promise<void> {
    try {
      const channelId = await this.channelService.createChannel(newChannel.name, newChannel.description);
      this.isCreateChannelVisible = false;
      this.isAddMembersVisible = true;  
      this.newChannelId = channelId;
      this.newChannelName = newChannel.name;
      this.openAddMembersPopup();

    console.log('isCreateChannelVisible:', this.isCreateChannelVisible);
    console.log('isAddMembersVisible:', this.isAddMembersVisible);
    console.log('newChannelId:', this.newChannelId);
    } catch (error) {
      console.error('Fehler beim Erstellen des Kanals:', error);
    }
  }  

  // Fügt Mitglieder zu einem Kanal hinzu
  async handleAddMembers(memberIds: string[]): Promise<void> {
    if (!this.newChannelId) return;

    try {
      await this.channelService.addMembersToChannel(this.newChannelId, memberIds);
      this.isAddMembersVisible = false;
      this.newChannelId = null;
      console.log('Mitglieder erfolgreich hinzugefügt:', memberIds);
    } catch (error) {
      console.error('Fehler beim Hinzufügen von Mitgliedern:', error);
    }
  }

  // Öffnet das Add-Members-Popup (für Debugging oder manuelle Aktionen)
  openAddMembersPopup(): void {
    this.isAddMembersVisible = true;  // Zeige Add-Members-Popup
    this.isCreateChannelVisible = false; // Verberge Create-Channel-Popup
  }
  

  // Schließt das Add-Members-Popup
  closeAddMembersPopup(): void {
    this.isAddMembersVisible = false;
  }
}
