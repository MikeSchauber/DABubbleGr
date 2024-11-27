import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) { // Benutzer ist eingeloggt
    router.navigate(['/dashboard'], { replaceUrl: true });
    return false; // Zugriff auf Login-Seiten verweigern
  }
  return true; // Zugriff gewähren
};

