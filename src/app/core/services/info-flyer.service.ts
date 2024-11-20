import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class InfoFlyerService {
  infos: string[] = [];

  constructor() {
    this.startInterval();
  }

  startInterval() {
    setInterval(() => {
      this.infos.splice(0, 1);
    }, 5000);
  }
}
