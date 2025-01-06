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
import { InfoFlyerService } from '../../../core/services/info-flyer.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput: ElementRef | undefined; // Referenz auf das file input
  newAvatarUrl: string = '';
  closeButton: string = 'assets/icons/close.svg';
  editForm = new FormGroup({
    fullName: new FormControl('', [
      Validators.required,
      Validators.maxLength(30),
    ]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor(
    public profileService: ProfileService,
    public authService: AuthService,
    public infoService: InfoFlyerService
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

  async onSubmit() {
    if (this.editForm.valid) {
      await this.profileService.saveEditings(this.editForm, this.newAvatarUrl);
    } else {
      this.infoService.createInfo('Daten nicht valide', true);
    }
  }

  close(event: MouseEvent) {
    event.preventDefault();
    this.profileService.toggleProfileDisplay();
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
        const dataUrl = await this.profileService.readFileAsDataUrl(file);
        this.newAvatarUrl = dataUrl;
      } catch (error) {
        console.error('Fehler beim Auswählen der Datei:', error);
      }
    }
  }
}
