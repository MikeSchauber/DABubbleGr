import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateChannelComponent } from '../../channel/create-channel/create-channel.component'; 
import { ChannelService } from '../../../core/services/channel.service';
import { CloudService } from '../../../core/services/cloud.service';

@Component({
  standalone: true,
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  imports: [CommonModule, CreateChannelComponent],
  providers: [ChannelService],  
})
export class SidenavComponent implements OnInit {
  channels$; 
  channels: { name: string }[] = [];
    
  @Output() channelSelected = new EventEmitter<string >();

  constructor(private channelService: ChannelService, public cloudService: CloudService) {
    this.channels$ = this.channelService.channels$;
  }

  isDirectMessagesExpanded = true;
  isChannelsExpanded = true;
  isArrowHovered = false;

  // Beispiel-Benutzerdaten
  users: { name: string; avatar: string }[] = [
    { name: 'Benutzer 1', avatar: 'assets/basic-avatars/avatar1.svg' },
    { name: 'Benutzer 2', avatar: 'assets/basic-avatars/avatar2.svg' },
    { name: 'Benutzer 3', avatar: 'assets/basic-avatars/avatar3.svg' },
    { name: 'Benutzer 4', avatar: 'assets/basic-avatars/avatar4.svg' }
  ];



  // Methode zur Umschaltung der Direktnachrichten-Sichtbarkeit
  toggleDirectMessages() {
    this.isDirectMessagesExpanded = !this.isDirectMessagesExpanded;
  }

  // Methode zur Umschaltung der Kanal-Liste-Sichtbarkeit
  toggleChannels() {
    this.isChannelsExpanded = !this.isChannelsExpanded;
  }

  ngOnInit(): void {
    // Abonnieren Sie den ChannelService und aktualisieren Sie die Kanäle in der Sidebar
    // this.channelService.channels$.subscribe((channels) => {
      this.channels = this.cloudService.channels;
   // });
  }


  // Beispiel-Methode zum Erstellen eines neuen Kanals
  async addChannel(name: string) {
    await this.channelService.createChannel(name, 'Default description');
  }

  selectChannel(channelId: string) {
    this.channelService.setCurrentChannel(channelId);
  }
}
