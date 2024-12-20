import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-start-animation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './start-animation.component.html',
  styleUrls: ['./start-animation.component.scss']
})
export class StartAnimationComponent implements OnInit {
  /** Indicates whether the start animation should be shown */
  showAnimation = true;

  /** Routes where the start animation should not be displayed */
  excludedRoutes = ['login', 'register', 'forgot-password', 'reset-password'];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() { 
    // Check if the user is logged in
    const isLoggedIn = !!localStorage.getItem('userToken'); 

    // Get the current route
    const currentRoute = this.route.snapshot.routeConfig?.path;

    // Play animation only if the user is not logged in and the route is not excluded
    if (this.excludedRoutes.includes(currentRoute || '') || isLoggedIn) {
      // If the user is logged in, navigate directly to the dashboard
      this.showAnimation = false;
      this.router.navigate(['/dashboard']);
    } else if (this.excludedRoutes.includes(currentRoute || '')) {
      // If the route is excluded, do not show the animation
      this.showAnimation = false; 
    } else {
      // Otherwise, start the animation
      this.runAnimation();
    }
  }

  /**
   * Starts the animation and navigates to the login page after it completes.
   */
  runAnimation() { 
    setTimeout(() => {
      this.showAnimation = false;
      this.navigateToLogin();  
    }, 2000);   
  }
  
  /**
   * Navigates to the login page.
   */
  navigateToLogin() { 
    this.showAnimation = false;
    this.router.navigate(['/login']);
  }
}
