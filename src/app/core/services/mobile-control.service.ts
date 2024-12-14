import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MobileControlService {
  isSidebarVisible = true;
  isChatVisible = false;
  isThreadBarVisible = false;
  constructor() {

  }

  isMobile() {
    return window.innerWidth < 950;
  }

  openSidenav() {
    if (this.isMobile()) {
      this.isSidebarVisible = true;
      this.isChatVisible = false;
      this.isThreadBarVisible = false;
    }
  }

  openChat() {
    if (this.isMobile()) {
      this.isSidebarVisible = false;
      this.isChatVisible = true;
      this.isThreadBarVisible = false;
    }
  }

  openThread() {
    if (this.isMobile()) {
      this.isSidebarVisible = false;
      this.isChatVisible = false;
      this.isThreadBarVisible = true;
    }
  }
}