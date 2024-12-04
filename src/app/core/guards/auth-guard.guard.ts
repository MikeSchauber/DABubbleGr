import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const userService = inject(UserService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    // Benutzer ist NICHT eingeloggt
    router.navigate(['/login'], { replaceUrl: true });
    return false; // Zugriff verweigern
  }
  authService.loadCurrentUserDataFromLocalStorage();
  userService.currentUserId = authService.currentUserData.publicUserId;
  return true; // Zugriff gewähren
};
