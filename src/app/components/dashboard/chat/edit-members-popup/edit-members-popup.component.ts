import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChannelService } from '../../../../core/services/channel.service';
import { MemberService } from '../../../../core/services/member.service';

@Component({
  selector: 'app-edit-members-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-members-popup.component.html',
  styleUrls: ['./edit-members-popup.component.scss']
})
export class EditMembersPopupComponent implements OnInit {
  @Input() channelId!: string;
  @Input() channelName!: string;
  @Input() memberIds: string[] = [];
  @Input() users: {
    name: string;
    avatar: string;
    userStatus: string;
  }[] = [];

  @Output() closePopup = new EventEmitter<void>();
  @Output() membersUpdated = new EventEmitter<string[]>();

  enrichedMembers: { id: string; displayName: string; avatarUrl: string; userStatus: string }[] = [];
  isAddMemberPopupOpen: boolean = false; // Controls the popup visibility
  newMemberName: string = ''; // Holds the input for the new member

  constructor(private memberService: MemberService, private channelService: ChannelService) {}

  ngOnInit() {
    this.loadMemberDetails();
  }

  // Loads member details from the member service
  loadMemberDetails() {
    this.enrichedMembers = [];
    this.memberIds.forEach((memberId) => {
      this.memberService.getMemberById(memberId).then((member) => {
        if (member) {
          this.enrichedMembers.push({
            id: memberId,
            displayName: member.displayName,
            avatarUrl: member.avatarUrl,
            userStatus: member.userStatus || 'offline' // Default to offline if status is missing
          });
        }
      });
    });
  }

  // Opens the Add Member popup
  openAddMemberPopup() {
    this.isAddMemberPopupOpen = true;
  }

  // Closes the Add Member popup
  closeAddMemberPopup() {
    this.isAddMemberPopupOpen = false;
  }

  // Adds a new member to the channel
  addMember() {
    if (this.newMemberName.trim()) {
      const newMember = {
        id: Date.now().toString(), // Generate a unique ID
        displayName: this.newMemberName,
        avatarUrl: '/assets/default-avatar.png', // Default avatar URL
        userStatus: 'offline' // Default status
      };

      this.enrichedMembers.push(newMember); // Add the new member to the enriched list
      this.newMemberName = ''; // Clear the input field
      this.closeAddMemberPopup(); // Close the popup
    } else {
      alert('Bitte geben Sie einen Namen ein!'); // Alert for empty input
    }
  }

  // Removes a member from the channel
  removeMember(memberId: string) {
    this.memberIds = this.memberIds.filter((id) => id !== memberId);
    this.enrichedMembers = this.enrichedMembers.filter((member) => member.id !== memberId);
    this.channelService.removeMemberFromChannel(this.channelId, memberId)
      .then(() => {
        console.log(`Mitglied ${memberId} entfernt`);
      })
      .catch((error) => {
        console.error(`Fehler beim Entfernen des Mitglieds ${memberId}:`, error);
      });
  }

  // Closes the main popup and emits the updated members
  close() {
    this.membersUpdated.emit(this.memberIds);
    this.closePopup.emit();
  }
}
