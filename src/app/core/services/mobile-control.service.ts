import { HostListener, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MobileControlService {
  isSidebarVisible = true;
  isChatVisible = false;
  isThreadBarVisible = false;
  constructor() {}

  /**
   * Updates the `isMobileView` state on window resize.
   */
  @HostListener('window:resize', [])
  isMobile() {
    return window.innerWidth <= 950;
  }

  /** Opens the sidenav (sidebar) if the device is mobile and hides other sections. */
  openSidenav() {
    if (this.isMobile()) {
      this.isSidebarVisible = true;
      this.isChatVisible = false;
      this.isThreadBarVisible = false;
    }
  }

  /** Opens the chat section if the device is mobile and hides other sections. */
  openChat() {
    if (this.isMobile()) {
      this.isSidebarVisible = false;
      this.isChatVisible = true;
      this.isThreadBarVisible = false;
    }
  }

  /** Opens the thread bar if the device is mobile and hides other sections. */
  openThread() {
    if (this.isMobile()) {
      this.isSidebarVisible = false;
      this.isChatVisible = false;
      this.isThreadBarVisible = true;
    }
  }

}