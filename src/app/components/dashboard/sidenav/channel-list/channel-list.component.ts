import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-channel-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.scss'],
})
export class ChannelListComponent {
  isArrowHovered: boolean = false; // Zustand, ob der Pfeil angezeigt wird
  @Input() channels: { name: string; id: string }[] = []; // Kanäle von der Elternkomponente
  @Input() isChannelsExpanded: boolean = true; // Zustand, ob die Liste expandiert ist

  @Output() toggleChannels = new EventEmitter<void>(); // Event zum Umschalten der Liste
  @Output() openCreateChannel = new EventEmitter<void>(); // Event zum Öffnen des Popups

  // Umschalten der Kanalliste
  onToggleChannels(): void {
    this.toggleChannels.emit();
  }

  // Öffnen des Popups zum Erstellen eines neuen Kanals
  onOpenCreateChannel(): void {
    this.openCreateChannel.emit();
  }
}
