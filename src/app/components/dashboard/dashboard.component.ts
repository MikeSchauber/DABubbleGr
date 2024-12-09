import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { ChatComponent } from './chat/chat.component';
import { ThreadBarComponent } from './thread-bar/thread-bar.component';
import { ChannelService } from '../../core/services/channel.service';
import { Observable, Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ChatService } from '../../core/services/chat.service';
import { SearchService } from '../../core/services/search.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidenavComponent,
    ChatComponent,
    ThreadBarComponent,
    ThreadBarComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('150ms ease-in-out', style({ transform: 'translateX(0%)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in-out', style({ transform: 'translateX(100%)' })),
      ]),
    ]),
    trigger('slideInOut2', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('150ms ease-in-out', style({ transform: 'translateX(0%)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in-out', style({ transform: 'translateX(-100%)' })),
      ]),
    ]),
  ],
})
export class DashboardComponent implements OnInit {
  private closeThreadBarSubscription: Subscription = new Subscription();

  selectedChannel: { name: string } | null = null;
  isSidebarVisible = true;
  isHovered = false;
  isThreadBarVisible = false;
  isMobileView = window.innerWidth <= 768;
  channels$: Observable<{ channelId: string; name: string }[]>;
  currentThreadId: string | null = null;

  constructor(
    private channelService: ChannelService,
    public profileService: ProfileService,
    private authService: AuthService,
    private userService: UserService,
    public chatService: ChatService,
    public searchService: SearchService,
  ) {
    // We initialize the channels$ observable by assigning the service observable
    this.channels$ = this.channelService.channels$;
  }

  async ngOnInit() {
    this.profileService.closePopup();
    this.checkMobileView();

    this.closeThreadBarSubscription =
      this.channelService.closeThreadBarEvent.subscribe(() => {
        this.onCloseThreadBar();
      });
  }

  ngOnDestroy() {
    // Unsubscribe to avoid memory leaks
    if (this.closeThreadBarSubscription) {
      this.closeThreadBarSubscription.unsubscribe();
    }
  }

  closePopups() {
    this.chatService.emojiPicker = false;
    this.searchService.searchQuery = '';
  }

  writeUserId() {
    this.authService.loadCurrentUserDataFromLocalStorage();
    this.userService.currentUserId =
      this.authService.currentUserData.publicUserId;
  }

  // HostListener, um auf Fenstergrößenänderungen zu reagieren
  @HostListener('window:resize', [])
  checkMobileView(): void {
    this.isMobileView = window.innerWidth <= 768;

    // Sidebar standardmäßig im mobilen Modus schließen
    if (this.isMobileView) {
      this.isSidebarVisible = false;
    } else {
      this.isSidebarVisible = true;
    }
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

  onOpenThreadBar(): void {
    this.isThreadBarVisible = true;
  }

  onCloseThreadBar(): void {
    this.isThreadBarVisible = false;
    this.currentThreadId = null; // Reset the thread ID
  }
}
