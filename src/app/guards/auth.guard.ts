import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StateService } from '../services/state.service';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const state = inject(StateService);
  const router = inject(Router);
  if (state.userSnapshot) return true;
  return router.createUrlTree(['/']);
};
