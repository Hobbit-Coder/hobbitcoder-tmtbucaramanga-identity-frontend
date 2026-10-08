import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session-service';
import { SignInUrlService } from '../services/sign-in-url-service';

/** Para las páginas de acceso: con una sesión ya iniciada sigue a `returnUrl` (o al inicio). */
export const noAuthGuard: CanActivateFn = (route) => {
  if (inject(SessionService).isAuthenticated()) {
    const returnUrl = inject(SignInUrlService).safeReturnUrl(route.queryParamMap.get('returnUrl'));

    return inject(Router).parseUrl(returnUrl);
  }

  return true;
};
