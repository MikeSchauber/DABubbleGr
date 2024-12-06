import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { UserService } from '../../../../core/services/user.service';
import { Observable } from 'rxjs';
import { User } from '../../../../models/interfaces/user.interface';
import { AuthService } from '../../../../core/services/auth.service';

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
export class DirectMessagesComponent implements OnInit {
  /** Observable for the list of public users from the UserService */
  users$: Observable<User[] | null>;

  //Roman neu
  currentUserId: string = '';

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

  constructor(private userService: UserService,
              private authService: AuthService
  ) {
    // Load public users from the UserService
    this.users$ = this.userService.publicUsers$;


    //Roman neu
    this.currentUserId = this.authService.currentUserId;

  }

  /**
   * Lifecycle hook to initialize the component.
   */
  ngOnInit(): void {
    // Log the loaded users for debugging
    this.users$.subscribe((users) => {
      console.log('Loaded users in Direct Messages:', users);
    });
  }

  /**
   * Emits an event to toggle the visibility of the direct messages list.
   */
  onToggleDirectMessages(): void {
    this.toggleDirectMessages.emit();
  }




  // Roman Private Messages START
   // Roman Private Messages START
    // Roman Private Messages START

  openPrivateMessage(otherUserId: string){
    //generate conversational id 
    //set current channel to conversationId
    //HTML in chat component header adapt to type - private (keine members , nur otherUser)

  }



  generateConversationId(currentUserId: string, otherUserId: string ): string { 
    return [currentUserId, otherUserId].sort().join('_'); 
  }

  // Roman Private Messages END
   // Roman Private Messages END
    // Roman Private Messages END

}
