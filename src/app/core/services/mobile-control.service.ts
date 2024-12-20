// import { HostListener, Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root',
// })
// export class MobileControlService {
//   isSidebarVisible = true;
//   isChatVisible = false;
//   isThreadBarVisible = false;
//   constructor() {}

//   /**
//    * Updates the `isMobileView` state on window resize.
//    */
//   @HostListener('window:resize', [])
//   isMobile() {
//     return window.innerWidth <= 950;
//   }

//   openSidenav() {
//     if (this.isMobile()) {
//       this.isSidebarVisible = true;
//       this.isChatVisible = false;
//       this.isThreadBarVisible = false;
//     }
//   }

//   openChat() {
//     if (this.isMobile()) {
//       this.isSidebarVisible = false;
//       this.isChatVisible = true;
//       this.isThreadBarVisible = false;
//     }
//   }

//   openThread() {
//     if (this.isMobile()) {
//       this.isSidebarVisible = false;
//       this.isChatVisible = false;
//       this.isThreadBarVisible = true;
//     }
//   }
// }


// import { HostListener, Injectable } from '@angular/core';
// @Injectable({
//   providedIn: 'root',
// })
// export class MobileControlService {
//   // Existing mobile properties
//   isSidebarVisible = true;
//   isChatVisible = false;
//   isThreadBarVisible = false;

//   // New desktop responsive properties
//   private readonly DESKTOP_BREAKPOINT = 1048;
//   private readonly MOBILE_BREAKPOINT = 950;

//   // Add method to check desktop breakpoint
//   isDesktopBreakpoint() {
//     return window.innerWidth <= this.DESKTOP_BREAKPOINT;
//   }

//   // Existing mobile breakpoint check
//   isMobile() {
//     return window.innerWidth <= this.MOBILE_BREAKPOINT;
//   }

//   // Modified methods to handle both mobile and desktop cases
//   openSidenav() {
//     if (this.isMobile()) {
//       // Existing mobile behavior
//       this.isSidebarVisible = true;
//       this.isChatVisible = false;
//       this.isThreadBarVisible = false;
//     } else if (this.isDesktopBreakpoint() && this.isThreadBarVisible) {
//       // New desktop behavior: close threadbar if it's open
//       this.isThreadBarVisible = false;
//     }
//     this.isSidebarVisible = true;
//   }

//   openChat() {
//     if (this.isMobile()) {
//       // Existing mobile behavior
//       this.isSidebarVisible = false;
//       this.isChatVisible = true;
//       this.isThreadBarVisible = false;
//     }
//   }

//   openThread() {
//     if (this.isMobile()) {
//       // Existing mobile behavior
//       this.isSidebarVisible = false;
//       this.isChatVisible = false;
//       this.isThreadBarVisible = true;
//     } else if (this.isDesktopBreakpoint() && this.isSidebarVisible) {
//       // New desktop behavior: close sidenav if it's open
//       this.isSidebarVisible = false;
//     }
//     this.isThreadBarVisible = true;
//   }

//   // Add method to check if we should allow both sidenav and threadbar
//   canShowBoth(): boolean {
//     return !this.isDesktopBreakpoint();
//   }

//   // Optional: Add a method to handle window resize
//   @HostListener('window:resize', [])
//   onResize() {
//     if (this.isDesktopBreakpoint() && this.isSidebarVisible && this.isThreadBarVisible) {
//       // If both are open at breakpoint, close threadbar
//       this.isThreadBarVisible = false;
//     }
//   }
// }

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
    console.log("hello");
    
    return window.innerWidth <= 950;
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