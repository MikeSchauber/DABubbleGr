import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})

export class EditProfileComponent implements OnInit {
  @Input() data: any = {};
  @Output() saveEdit = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  formData: any = {};

  ngOnInit(): void {
    // Initialisiert das Formular mit den bestehenden Daten
    this.formData = { ...this.data };
  }

  save(): void {
    console.log('Saving profile changes...', this.formData);
    this.saveEdit.emit(this.formData);
  }

  // Emit close event when the close button is clicked
  closePopup(): void {
    this.close.emit();
  }
}
