import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ChannelService } from '../../../core/services/channel.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-channel',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './create-channel.component.html',
  styleUrls: ['./create-channel.component.scss']
})
export class CreateChannelComponent implements AfterViewInit { 
  isCreateChannelVisible = false;  
  isAddMembersVisible = false;
  selectedOption: string | null = null; // Keine Auswahl zu Beginn
  channelName: string = '';
  description: string = '';
  memberName: string = '';
  members: string[] = [];

  constructor(private channelService: ChannelService) {}

  @ViewChild('description', { static: false }) descriptionElement!: ElementRef;


  ngAfterViewInit() {
    if (this.descriptionElement) {
      this.descriptionElement.nativeElement.addEventListener('input', this.autoResize);
    }
  }

  // Dynamische Höhenanpassung des Textfelds
  autoResize = () => {
    const element = this.descriptionElement?.nativeElement;
    if (element) {
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    }
  };


  // Öffnet das Popup
  openCreateChannelPopup() { 
    this.isCreateChannelVisible = true;
    this.isAddMembersVisible = false;  
  }
  

  // Schließt das Popup
  closePopup() {
    this.isCreateChannelVisible = false;
    this.isAddMembersVisible = false;
  }

 // Erstellt den Kanal und wechselt zum Mitglieder-Hinzufügen-Schritt
 async createChannel() {
  if (this.channelName) {
    try {
      await this.channelService.createChannel(this.channelName, this.description);
      this.isCreateChannelVisible = false; 
      this.isAddMembersVisible = true; 
        // Eingabefelder nach dem erfolgreichen Erstellen des Kanals leeren
      this.channelName = '';
      this.description = '';
    } catch (error) {
      console.error('Fehler beim Erstellen des Kanals:', error);
    }
  }
}



  // Setzt die Auswahloption und zeigt ggf. das Eingabefeld an
  selectOption(option: string) {
    this.selectedOption = option;
  }

  // Fügt Mitglieder basierend auf der Auswahl hinzu und schließt das Popup
  addMembers() {
    if (this.selectedOption === 'all') {
      console.log('Alle Mitglieder im Office-Team hinzufügen');
    } else if (this.selectedOption === 'specific' && this.memberName) {
      this.members.push(this.memberName);
      console.log(`Füge Mitglied ${this.memberName} hinzu`);
    }
    this.closePopup();
  }
}