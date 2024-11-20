import { Injectable } from '@angular/core';
import { InfoInterface } from '../../interfaces/info-interface';
import { Info } from '../../models/info.class';

@Injectable({
  providedIn: 'root',
})
export class InfoFlyerService {
  info: InfoInterface[] = [];

  constructor() {
    this.startInterval();
  }

  createInfo(info: string, error: boolean) {
    const infoObject = new Info(info, error);
    this.info.push(infoObject);
  }

  startInterval() {
    setInterval(() => {
      this.info.splice(0, 1);
    }, 2500);
  }
}
