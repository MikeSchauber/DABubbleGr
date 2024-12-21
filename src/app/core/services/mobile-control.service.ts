import { HostListener, Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class MobileControlService {
  isSidebarVisible = true;
  isChatVisible = false;
  isThreadBarVisible = false;
  
  private readonly DESKTOP_BREAKPOINT = 1048;
  private readonly MOBILE_BREAKPOINT = 950;


  ///Check if sidenav, chat and threadbar fit side by side, from 1048 screen width and lower only two components should be visible at the same time
  isDesktopBreakpoint() {
    return window.innerWidth <= this.DESKTOP_BREAKPOINT;
  }

  isMobile() {
    return window.innerWidth <= this.MOBILE_BREAKPOINT;
  }


  //Below 1048px screen and width and above mobile view: Whenever only sidenav or threadbar are visible with chat, not all three
  toggleSidenav() {
    if (this.isDesktopBreakpoint() && !this.isSidebarVisible && this.isThreadBarVisible) {
      this.isThreadBarVisible = false;
    }
    this.isSidebarVisible = !this.isSidebarVisible;
    
    if (this.isMobile()) {
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
    if (this.isDesktopBreakpoint() && this.isSidebarVisible) {
      this.isSidebarVisible = false;
    }
    this.isThreadBarVisible = true;
    
    if (this.isMobile()) {
      this.isSidebarVisible = false;
      this.isChatVisible = false;
    }
  }

  closeThread() {
    this.isThreadBarVisible = false;
    if (this.isMobile()) {
      this.openChat();
    }
  }

  @HostListener('window:resize', [])
  onResize() {
    if (this.isDesktopBreakpoint() && this.isSidebarVisible && this.isThreadBarVisible) {
      this.isThreadBarVisible = false;
    }
  }
}