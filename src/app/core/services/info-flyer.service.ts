import { Injectable } from '@angular/core';
import { InfoInterface } from '../../interfaces/info-interface';
import { Info } from '../../models/info.class';

@Injectable({
  providedIn: 'root',
})
export class InfoFlyerService {
  info: InfoInterface[] = [];

  constructor() {}

  createInfo(info: string, error: boolean) {
    const infoObject = new Info(info, error);
    this.info.push(infoObject);
    setTimeout(() => {
      infoObject.visible = true;
    }, 50);
    setTimeout(() => {
      infoObject.visible = false;
      setTimeout(() => {
        this.info.splice(0, 1);
      }, 150);
    }, 4500);
  }
}
