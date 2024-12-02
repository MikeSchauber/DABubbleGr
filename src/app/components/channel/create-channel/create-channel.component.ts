import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChannelService } from '../../../core/services/channel.service';
import { MemberService } from '../../../core/services/member.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-create-channel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-channel.component.html',
  styleUrls: ['./create-channel.component.scss'],
})
export class CreateChannelComponent implements AfterViewInit, OnInit {

  isCreateChannelVisible: boolean = false; // Tracks visibility of the "Create Channel" popup
  isAddMembersVisible: boolean = false; // Tracks visibility of the "Add Members" popup

  channelName = '';
  description = '';

  @Input() isMobileView: boolean = false;
  @Input() members: Array<{ displayName: string; authId: string }> = [];
  @Input() channelId: string = '';

  @Output() createChannel = new EventEmitter<{ name: string; description: string }>();
  @Output() closePopup = new EventEmitter<void>();
  @Output() openAddMembers = new EventEmitter<void>();

  emitCreateChannel(): void {
    if (this.channelName.trim().length < 3) {
      alert('The channel name must be at least 3 characters long.');
      return;
    }
    this.createChannel.emit({ name: this.channelName, description: this.description });
  }
  
  emitClosePopup(): void {
    this.closePopup.emit();
  }
  
  selectedOption: 'all' | 'specific' | null = null; // Option for adding members
  memberName: string = ''; // Name of the specific member to be added
  // List of members
 

  @ViewChild('description', { static: false }) descriptionElement!: ElementRef;

  constructor(
    private channelService: ChannelService,
    private memberService: MemberService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMembers(); // Load members when the component initializes
  }

  ngAfterViewInit() {
    if (this.descriptionElement) {
      this.descriptionElement.nativeElement.addEventListener('input', this.autoResize);
    }
  }

  // Dynamically adjust the textarea height
  autoResize = () => {
    const element = this.descriptionElement?.nativeElement;
    if (element) {
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    }
  };

  // Fetch members from the MemberService
  private async loadMembers(): Promise<void> {
    try {
      this.members = await this.memberService.fetchAllMembers();
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  // Close the popup and reset state
  handleClosePopup(): void {
    console.log('Closing Popup');
    this.closePopup.emit();
    this.resetState();
  }

   // Emit the updated channel name
  onChannelNameChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.channelName = input.value;
  }

  // Emit the updated description
  onDescriptionChange(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.description = textarea.value;
  }

  // Emit the event to create a new channel
  handleCreateChannel(): void {
    if (this.channelName.trim().length < 3) {
      alert('The channel name must be at least 3 characters long.');
      return;
    }

    this.createChannel.emit({
      name: this.channelName,
      description: this.description,
    });
 
    if (this.isMobileView) {
      this.isCreateChannelVisible = false; // Hide the "Create Channel" popup
     this.isAddMembersVisible = true; // Tracks visibility of the "Add Members" popup
     } else {
    this.closePopup.emit(); // Desktop: Parent-Komponente steuert Sichtbarkeit
    }
}
  

  // Select option for adding members
  selectOption(option: 'all' | 'specific'): void {
    this.selectedOption = option;
  }

  

  // Reset form state and fields
  private resetState(): void {
    this.channelName = '';
    this.description = '';  
    this.memberName = '';
  }

  
}
