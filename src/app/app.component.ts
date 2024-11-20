import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CloudService } from './core/services/cloud.service';
import { CommonModule } from '@angular/common';
import { InfoFlyerComponent } from './components/auth/info-flyer/info-flyer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatProgressSpinnerModule,
    CommonModule,
    InfoFlyerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'], 
})

export class AppComponent {
  title = 'dabubble'; 

  constructor(public cloudService: CloudService) {}
}

