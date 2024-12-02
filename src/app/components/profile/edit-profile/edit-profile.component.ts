import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { updateDoc } from '@angular/fire/firestore';
import { CloudService } from '../../../core/services/cloud.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput: ElementRef | undefined; // Referenz auf das file input
  newAvatarUrl: string = "";
  closeButton: string = 'assets/icons/close.svg';
  editForm = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor(
    public profileService: ProfileService,
    public authService: AuthService,
    private cloudService: CloudService
  ) {}

  ngOnInit() {
    this.editForm = new FormGroup({
      fullName: new FormControl(this.authService.currentUserData.displayName, [
        Validators.required,
      ]),
      email: new FormControl(this.authService.currentUserData.displayEmail, [
        Validators.required,
        Validators.email,
      ]),
    });
  }

  onSubmit() {
    if (this.editForm.valid) {
      this.profileService.saveEditings(this.editForm, this.newAvatarUrl);
    }
  }

  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        const dataUrl = await this.readFileAsDataUrl(file);
        this.newAvatarUrl = dataUrl;
      } catch (error) {
        console.error('Fehler beim Auswählen der Datei:', error);
      }
    }
  }
  
  readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string); 
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }
}
