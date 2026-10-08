import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';
import { AccessTokenService } from '../services/access-token-service';
import { AudienceService } from '../services/audience-service';

/**
 * Agrega `Authorization: Bearer` con un token de la audiencia de Identity a los endpoints protegidos
 * de su API (`/api/...`). Las demás peticiones (incluidos login, registro, refresh y logout) salen sin
 * tocar.
 */
export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const audience = inject(AudienceService).forUrl(request.url);

  if (audience === null) {
    return next(request);
  }

  return inject(AccessTokenService)
    .get(audience)
    .pipe(switchMap((token) => next(withBearerToken(request, token))));
};

function withBearerToken<T>(request: HttpRequest<T>, token: string): HttpRequest<T> {
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
