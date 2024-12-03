import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { UserService } from '../../../../core/services/user.service';
import { Observable } from 'rxjs';
import { User } from '../../../../models/interfaces/user.interface';


@Component({
  selector: 'app-direct-messages',
  templateUrl: './direct-messages.component.html',
  styleUrls: ['./direct-messages.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})

export class DirectMessagesComponent implements OnInit {
  users$: Observable<User[] | null>;

  @Input() users: { name: string; avatar: string; userStatus: 'online' | 'away' | 'offline'}[] = [];
  @Input() isDirectMessagesExpanded: boolean = true;
  @Input() isArrowHovered: boolean = false;

  @Output() toggleDirectMessages = new EventEmitter<void>();

 constructor(private userService: UserService) {
    // Benutzer aus dem UserService laden
    this.users$ = this.userService.publicUsers$;
  }

  ngOnInit(): void {
    // Debugging: Geladene Benutzer in der Konsole anzeigen
    this.users$.subscribe((users) => {
      console.log('Loaded users in Direct Messages:', users);
    });
  }


  onToggleDirectMessages() {
    this.toggleDirectMessages.emit();
  }
}
