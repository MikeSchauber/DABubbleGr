import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../core/services/member.service';
import { InfoFlyerService } from '../../../core/services/info-flyer.service';

/**
 * @class CreateChannelComponent
 * @description Handles the creation of a new channel and the addition of members. It supports both desktop and mobile views.
 */
@Component({
  selector: 'app-create-channel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-channel.component.html',
  styleUrls: ['./create-channel.component.scss'],
})
export class CreateChannelComponent implements AfterViewInit, OnInit {
  /** Tracks visibility of the "Create Channel" popup */
  isCreateChannelVisible: boolean = false;

  /** Tracks visibility of the "Add Members" popup */
  isAddMembersVisible: boolean = false;

  /** Name of the channel being created */
  channelName: string = '';

  /** Description of the channel */
  description: string = '';

  /** Indicates whether the component is in mobile view */
  @Input() isMobileView: boolean = false;

  /** List of members to choose from */
  @Input() members: Array<{ displayName: string; authId: string }> = [];

  /** ID of the channel (used for editing or specific cases) */
  @Input() channelId: string = '';

  /** Emits the channel name and description when a channel is created */
  @Output() createChannel = new EventEmitter<{
    name: string;
    description: string;
  }>();

  /** Emits an event to close the popup */
  @Output() closePopup = new EventEmitter<void>();

  /** Emits an event to open the "Add Members" popup */
  @Output() openAddMembers = new EventEmitter<void>();

  /** Tracks the selected option for adding members ('all' or 'specific') */
  selectedOption: 'all' | 'specific' | null = null;

  /** Name of a specific member to add */
  memberName: string = '';

  /** Reference to the description textarea for auto-resizing */
  @ViewChild('description', { static: false }) descriptionElement!: ElementRef;

  constructor(
    private memberService: MemberService,
    public infoService: InfoFlyerService
  ) {}

  /**
   * Lifecycle hook to initialize the component.
   * Loads members from the MemberService.
   */
  ngOnInit(): void {
    this.loadMembers(); // Load members when the component initializes
  }

  /**
   * Lifecycle hook for actions after the view initializes.
   * Adds an input event listener to dynamically resize the description textarea.
   */
  ngAfterViewInit(): void {
    if (this.descriptionElement) {
      this.descriptionElement.nativeElement.addEventListener(
        'input',
        this.autoResize
      );
    }
  }

  /**
   * Dynamically adjusts the textarea height based on its content.
   */
  autoResize = (): void => {
    const element = this.descriptionElement?.nativeElement;
    if (element) {
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    }
  };

  /**
   * Fetches all members from the MemberService.
   */
  private async loadMembers(): Promise<void> {
    try {
      this.members = await this.memberService.fetchAllMembers();
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  /**
   * Handles closing the popup and resets form state.
   */
  handleClosePopup(): void {
    this.closePopup.emit();
    this.resetState();
  }

  /**
   * Updates the channel name as the user types.
   * @param event - Input event from the channel name field.
   */
  onChannelNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.channelName = input.value;
  }

  /**
   * Updates the channel description as the user types.
   * @param event - Input event from the description textarea.
   */
  onDescriptionChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.description = textarea.value;
  }

  /**
   * Emits the event to create a new channel with the given name and description.
   */
  handleCreateChannel(): void {
    if (this.channelName.trim().length < 3) {
      this.infoService.createInfo('Mindestens 3 Zeichen', true);
      return;
    }

    this.createChannel.emit({
      name: this.channelName,
      description: this.description,
    });

    if (this.isMobileView) {
      this.isCreateChannelVisible = false; // Hide the "Create Channel" popup for mobile
      this.isAddMembersVisible = true; // Show "Add Members" popup for mobile
    } else {
      this.closePopup.emit(); // Desktop: Let the parent component manage visibility
    }
  }

  /**
   * Updates the selected option for adding members.
   * @param option - Selected option ('all' or 'specific').
   */
  selectOption(option: 'all' | 'specific'): void {
    this.selectedOption = option;
  }

  /**
   * Resets the form state and clears all input fields.
   */
  private resetState(): void {
    this.channelName = '';
    this.description = '';
    this.memberName = '';
  }
}
