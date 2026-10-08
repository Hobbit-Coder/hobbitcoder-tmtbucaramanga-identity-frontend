import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { SessionService } from '../services/session-service';
import { SignInUrlService } from '../services/sign-in-url-service';

/** Solo deja pasar con una sesión iniciada; si no, lleva al login y recuerda a dónde se quería ir. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(SessionService).isAuthenticated()) {
    return true;
  }

  return inject(SignInUrlService).signInUrlTree(state.url);
};
