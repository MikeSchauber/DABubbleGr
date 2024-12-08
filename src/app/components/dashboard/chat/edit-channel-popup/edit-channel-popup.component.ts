import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-channel-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-channel-popup.component.html',
  styleUrls: ['./edit-channel-popup.component.scss'],
})
export class EditChannelPopupComponent {
  /** Indicates whether the component is in mobile view */
  @Input() isMobileView: boolean = false;

  /** Channel data inputs */
  @Input() channelName: string = '';
  @Input() description: string = '';
  @Input() createdBy: string = '';
  @Input() channelId: string = '';

  /** Output events */
  @Output() channelChanges = new EventEmitter<{ name: string; description: string }>();
  @Output() closePopup = new EventEmitter<void>();

  /** Edit mode states */
  isEditChannelMode: boolean = false;
  isEditDescriptionMode: boolean = false;

  /**
   * Toggles edit mode for the channel name.
   */
  toggleEditChannelMode(): void {
    this.isEditChannelMode = !this.isEditChannelMode;
    if (this.isEditChannelMode) {
      this.isEditDescriptionMode = false; // Ensure only one mode is active
    }
  }

  /**
   * Toggles edit mode for the description.
   */
  toggleEditDescriptionMode(): void {
    this.isEditDescriptionMode = !this.isEditDescriptionMode;
    if (this.isEditDescriptionMode) {
      this.isEditChannelMode = false; // Ensure only one mode is active
    }
  }

  /**
   * Saves changes for the channel name.
   */
  saveChannelChanges(): void {
    if (!this.channelName.trim()) {
      console.error('Channel name cannot be empty.');
      return;
    }

    this.channelChanges.emit({
      name: this.channelName,
      description: this.description,
    });
    console.log('Channel name saved:', this.channelName);

    this.isEditChannelMode = false;
  }

  /**
   * Saves changes for the description.
   */
  saveDescriptionChanges(): void {
    this.channelChanges.emit({
      name: this.channelName,
      description: this.description,
    });
    console.log('Channel description saved:', this.description);

    this.isEditDescriptionMode = false;
  }

  /**
   * Handles closing the popup and resetting states.
   */
  onClose(): void {
    this.resetState();
    this.closePopup.emit();
  }

  /**
   * Resets the form state.
   */
  private resetState(): void {
    this.isEditChannelMode = false;
    this.isEditDescriptionMode = false;
  }
}
