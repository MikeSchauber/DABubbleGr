import { Injectable } from '@angular/core';
import { InfoInterface } from '../../models/interfaces/info-interface';
import { Info } from '../../models/info.class';

@Injectable({
  providedIn: 'root',
})
export class InfoFlyerService {
  info: InfoInterface[] = [];

  constructor() {}

  /** Creates an info message and displays it, hiding it after a set duration.
   * @param {string} info - The message to display in the info notification.
   * @param {boolean} error - A flag indicating whether the info message is an error (true) or not (false). */
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
