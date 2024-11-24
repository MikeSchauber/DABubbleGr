import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-direct-messages',
  templateUrl: './direct-messages.component.html',
  styleUrls: ['./direct-messages.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class DirectMessagesComponent {
  @Input() users: { name: string; avatar: string }[] = [];
  @Input() isDirectMessagesExpanded: boolean = true;
  @Input() isArrowHovered: boolean = false;

  @Output() toggleDirectMessages = new EventEmitter<void>();

  onToggleDirectMessages() {
    this.toggleDirectMessages.emit();
  }
}
