import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateChannelComponent } from '../create-channel/create-channel.component';
import { AddMembersComponent } from '../add-members/add-members.component';
import { UserService } from '../../../core/services/user.service';
import { Observable } from 'rxjs'; 
import { User } from '../../../models/interfaces/user.interface';

/**
 * @class PopupManagerComponent
 * @description Manages the rendering of different popups (e.g., create channel, add members) and handles their actions.
 */
@Component({
  selector: 'app-popup-manager',
  standalone: true,
  imports: [
    FormsModule, 
    CommonModule,  
    CreateChannelComponent,
    AddMembersComponent
  ],
  templateUrl: './popup-manager.component.html',
  styleUrls: ['./popup-manager.component.scss']
})
export class PopupManagerComponent implements OnInit { 
  /** Type of popup to display ('createChannel' or 'addMembers') */
  @Input() popupType!: string;

  /** Data passed to the popup (e.g., channel info for adding members) */
  @Input() popupData: any;

  /** Indicates if the popup is being viewed on a mobile device */
  @Input() isMobileView = false;

  /** Emits when the popup is closed */
  @Output() close = new EventEmitter<void>();

  /** Emits actions (e.g., create channel, add members) performed in the popup */
  @Output() action = new EventEmitter<any>();

  /** Observable of all users for the add members popup */
  users$: Observable<User[]> = new Observable();

  isCreateChannelVisible: boolean = false;
  isAddMembersVisible: boolean = false;

  constructor(private userService: UserService) {}
    
  /**
   * Lifecycle hook to initialize the component.
   * Fetches the list of users for the add members popup.
   */
  ngOnInit(): void {
    this.users$ = this.userService.getUsers();
  }

  /**
   * Emits an event to close the popup.
   */
  closePopup(): void {
    this.close.emit();
  }

  /**
   * Handles actions from the popup and emits them to the parent component.
   * @param data - Data associated with the action (e.g., channel details or selected members).
   */
  handleAction(data: any): void {
    this.action.emit(data);
  }
  closePopupVisibility(): void {
    this.popupType = ''; // Reset popupType to close the popup
    this.close.emit();   // Emit the close event to notify the parent
  }  
}
