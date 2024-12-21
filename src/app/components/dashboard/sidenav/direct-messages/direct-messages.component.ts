
import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { combineLatest, map, Observable, Subject, take, takeUntil } from 'rxjs';
import { User } from '../../../../models/interfaces/user.interface';
import { AuthService } from '../../../../core/services/auth.service';
import { ChannelService } from '../../../../core/services/channel.service';

/**
 * @class DirectMessagesComponent
 * @description Displays and manages the list of direct messages (users) and allows toggling the visibility of the list.
 */
@Component({
  selector: 'app-direct-messages',
  templateUrl: './direct-messages.component.html',
  styleUrls: ['./direct-messages.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class DirectMessagesComponent implements OnDestroy {

  private destroy$ = new Subject<void>();
  /** Observable for the list of public users from the UserService */
  users$: Observable<User[] | null>;
  
  //Roman neu
  // currentUserId: string = '';

  /** List of users passed from the parent component */
  @Input() users: {
    name: string;
    avatar: string;
    userStatus: 'online' | 'away' | 'offline';
  }[] = [];

  /** Indicates whether the direct messages list is expanded */
  @Input() isDirectMessagesExpanded: boolean = true;

  /** Indicates if the arrow is hovered */
  @Input() isArrowHovered: boolean = false;

  /** Event emitted to toggle the visibility of the direct messages list */
  @Output() toggleDirectMessages = new EventEmitter<void>();

  constructor(public userService: UserService,
              public authService: AuthService,
              public channelService: ChannelService
  ) {
    // Load public users from the UserService
    this.users$ = this.userService.publicUsers$;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Emits an event to toggle the visibility of the direct messages list.
   */
  onToggleDirectMessages(): void {
    this.toggleDirectMessages.emit();
  }
}