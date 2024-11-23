import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; 

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

 // Trigger edit mode
 startEdit(event: Event): void {
  event.preventDefault(); // Prevent link navigation
  this.edit.emit();
}

  // Retrieve status text based on status
  getStatusText(): string {
    return this.data.status === 'active' ? 'Aktiv' : 'Abwesend';
  }

  // Emit close event when the close button is clicked
  closePopup(): void {
    this.close.emit();
  }
}