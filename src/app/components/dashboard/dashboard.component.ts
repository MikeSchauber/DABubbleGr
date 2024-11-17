import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { ChatComponent } from './chat/chat.component';
import { ThreadBarComponent } from './thread-bar/thread-bar.component';
import { ChannelService } from '../../core/services/channel.service';
import { Observable } from 'rxjs'; 

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidenavComponent,
    ChatComponent,
    ThreadBarComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  selectedChannel: { name: string } | null = null;
  isSidebarVisible = true;
  isHovered = false;
  channels$: Observable<{ id: string; name: string }[]>;

  constructor(private channelService: ChannelService) {
    // We initialize the channels$ observable by assigning the service observable
    this.channels$ = this.channelService.channels$;
  }

  ngOnInit(): void {
    // Additional setup if needed; channels$ is already assigned via the constructor.
  }

  // Method to toggle sidebar visibility
  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  // Method to set hover state
  onHover(isHovered: boolean) {
    this.isHovered = isHovered;
  }

  onChannelSelected(channel: any) {
    this.selectedChannel = channel;
  }
}
