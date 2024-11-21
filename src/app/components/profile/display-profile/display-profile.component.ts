import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudService } from '../../../core/services/cloud.service';

@Component({
  selector: 'app-display-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-profile.component.html',
  styleUrls: ['./display-profile.component.scss'],
})
export class DisplayProfileComponent { 
  @Input() data: any;
  @Output() edit = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  startEdit(event: Event): void {
    event.preventDefault(); // Verhindert Link-Navigation
    this.edit.emit();
  }

  getStatusText(): string {
    return this.data.status === 'active' ? 'Aktiv' : 'Abwesend';
  }
}