import { inject } from '@angular/core';
import { CanActivateFn, Route, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SessionService } from '../services/session-service';
import { SignInUrlService } from '../services/sign-in-url-service';
import { UserRolesService } from '../services/user-roles-service';

const ROLES_DATA_KEY = 'roles';
const UNAUTHORIZED_PATH = '/error/unauthorized';

/**
 * Solo deja entrar a usuarios con alguno de los roles de la ruta (`requireRoles`); los demás van a la
 * página de acceso denegado. Sin sesión lleva al login, como `authGuard`. Solo controla la
 * navegación: la API valida los roles en cada petición.
 */
export const accessRoleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  if (!inject(SessionService).isAuthenticated()) {
    return inject(SignInUrlService).signInUrlTree(state.url);
  }

  const allowedRoles = (route.data[ROLES_DATA_KEY] ?? []) as readonly string[];

  return inject(UserRolesService)
    .hasAnyRoleAsync(allowedRoles)
    .pipe(
      map((isAllowed) => isAllowed || router.parseUrl(UNAUTHORIZED_PATH)),
      catchError(() => of(false)),
    );
};

/**
 * Configuración de ruta que exige alguno de los roles:
 * `{ path: 'users', ...requireRoles([Role.Admin]), loadChildren }`.
 */
export function requireRoles(roles: readonly string[]): Pick<Route, 'canActivate' | 'data'> {
  return { canActivate: [accessRoleGuard], data: { [ROLES_DATA_KEY]: roles } };
}
