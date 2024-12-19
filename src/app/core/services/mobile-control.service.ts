import { HostListener, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MobileControlService {
  isSidebarVisible = true;
  isChatVisible = false;
  isThreadBarVisible = false;
  isMobileView = false;
  constructor() {
    this.updateViewportState();
  }

  /**
   * Updates the `isMobileView` state on window resize.
   */
  @HostListener('window:resize', [])
  updateViewportState() {
    this.isMobileView = window.innerWidth <= 950;
  }

  isMobile() {
    return this.isMobileView;
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
