import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateChannelComponent } from '../create-channel/create-channel.component';
import { AddMembersComponent } from '../add-members/add-members.component';
import { UserService } from '../../../core/services/user.service';
import { Observable } from 'rxjs'; 
import { User } from '../../../models/interfaces/user.interface';

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
  @Input() popupType!: string; // Type of popup ('createChannel', 'addMembers')
  @Input() popupData: any; // Data passed to the popup
  @Input() isMobileView = false; // Indicates mobile view status

  @Output() close = new EventEmitter<void>(); // Event to close the popup
  @Output() action = new EventEmitter<any>(); // Event for actions within the popup

  users$: Observable<User[]> = new Observable(); // Observable for all users
 

  constructor(private userService: UserService) {}
    
  ngOnInit(): void {
    // Fetch all users
    this.users$ = this.userService.getUsers();
  }

  // Close the popup
  closePopup(): void {
    this.close.emit();
  }

  // Handle actions (e.g., create channel, add members)
  handleAction(data: any): void {
    this.action.emit(data);
  }
}
