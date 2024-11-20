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
  showAnimation = true;

  // Routen, bei denen die Startanimation nicht gezeigt werden soll
  excludedRoutes = ['login', 'register', 'forgot-password', 'reset-password'];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() { 
    // Überprüfe, ob der Nutzer eingeloggt ist
    const isLoggedIn = !!localStorage.getItem('userToken'); 

    // Überprüfe die aktuelle Route
    const currentRoute = this.route.snapshot.routeConfig?.path;

    // Bedingung: Animation nur abspielen, wenn der Benutzer nicht eingeloggt ist und die Route nicht ausgeschlossen ist
    if (this.excludedRoutes.includes(currentRoute || '') || isLoggedIn) {
      // Wenn eingeloggt, navigiere direkt zum Dashboard
      this.showAnimation = false;
      this.router.navigate(['/dashboard']);
    } else if (this.excludedRoutes.includes(currentRoute || '')) {
      // Wenn die Route in der Ausschlussliste ist, zeige keine Animation
      this.showAnimation = false; 
    } else {
      // Andernfalls starte die Animation 
      this.runAnimation();
    }
  }
  runAnimation() { 
    setTimeout(() => {
      this.showAnimation = false;
      console.log('Animation abgeschlossen. showAnimation:', this.showAnimation);
      this.navigateToLogin();  
    }, 2000);   
  }
  

  navigateToLogin() { 
    this.showAnimation = false;
    console.log('Navigiere zur Login-Seite');
    this.router.navigate(['/login']);
  }
  
}
