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
import { ChannelService } from '../../../core/services/channel.service';

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
/**
 * Component for creating a channel and managing its details, including the ability to add members.
 * This component handles the "Create Channel" and "Add Members" workflows.
 */
export class CreateChannelComponent implements AfterViewInit, OnInit {
  /** ====== State Variables ====== **/
  /**
   * Visibility states for popups:
   * - `isCreateChannelVisible`: Controls the visibility of the "Create Channel" popup.
   * - `isAddMembersVisible`: Controls the visibility of the "Add Members" popup.
   */
  isCreateChannelVisible: boolean = false;
  isAddMembersVisible: boolean = false;

  /**
   * Channel details:
   * - `channelName`: Name of the channel being created.
   * - `description`: Description of the channel.
   */
  channelName: string = '';
  description: string = '';
  existingChannelNames: string[] = [];

  /** ====== Input Properties ====== **/
  /**
   * Input properties for component configuration:
   * - `isMobileView`: Indicates whether the component is displayed in mobile view.
   * - `members`: List of members to choose from, each with `displayName` and `authId`.
   * - `channelId`: ID of the channel, used for editing or specific cases.
   */
  @Input() isMobileView: boolean = false;
  @Input() members: Array<{ displayName: string; authId: string }> = [];
  @Input() channelId: string = '';

  /** ====== Output Events ====== **/
  /**
   * Output events to communicate with the parent component:
   * - `createChannel`: Emits the channel name and description when a channel is created.
   * - `closePopup`: Emits an event to close the popup.
   * - `openAddMembers`: Emits an event to open the "Add Members" popup.
   */
  @Output() createChannel = new EventEmitter<{ name: string; description: string }>();
  @Output() closePopup = new EventEmitter<void>();
  @Output() openAddMembers = new EventEmitter<void>();

  /** ====== Member Management ====== **/
  /**
   * Member selection variables:
   * - `selectedOption`: Tracks the selected option for adding members (`'all'` or `'specific'`).
   * - `memberName`: Name of a specific member to add.
   */
  selectedOption: 'all' | 'specific' | null = null;
  memberName: string = '';

  /** ====== ViewChild References ====== **/
  /**
   * Reference to the description textarea element for auto-resizing functionality.
   */
  @ViewChild('description', { static: false }) descriptionElement!: ElementRef;

  constructor(
    public infoService: InfoFlyerService,
    private channelService: ChannelService,
    private memberService: MemberService
  ) {}

  /**
   * Lifecycle hook to initialize the component.
   * Loads members from the MemberService.
   */
  ngOnInit(): void {
    this.loadExistingChannels(); 
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
   * Fetches the list of existing channel names to prevent duplicates.
   */
   private loadExistingChannels(): void {
    this.channelService.channels$.subscribe((channels) => {
      this.existingChannelNames = channels.map((channel) => channel.name.toLowerCase());
    });
  }

  /**
   * Emits the event to create a new channel with the given name and description.
   */
  handleCreateChannel(): void {
    if (this.channelName.trim().length < 3) {
      this.infoService.createInfo('Mindestens 3 Zeichen', true);
      return;
    }

    // Check if the channel name already exists
    if (this.existingChannelNames.includes(this.channelName.toLowerCase())) {
    this.infoService.createInfo('A channel with this name already exists.', true);
    return;
    }

    this.createChannel.emit({
      name: this.channelName,
      description: this.description,
    });

    if (this.isMobileView) {
      this.isCreateChannelVisible = false; 
      this.isAddMembersVisible = true; 
    } else {
      this.closePopup.emit(); 
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
