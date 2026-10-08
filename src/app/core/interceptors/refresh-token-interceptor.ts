import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AccessTokenService } from '../services/access-token-service';
import { AudienceService } from '../services/audience-service';

/**
 * Si una API responde 401 a una petición con token (vencido o revocado en el servidor), descarta ese
 * token y reintenta una vez: `jwtInterceptor` adjunta entonces uno renovado. Si la sesión ya no es
 * válida, `AccessTokenService` la cierra y lleva al login.
 *
 * Debe registrarse antes que `jwtInterceptor` para que el reintento vuelva a pasar por él.
 */
export const refreshTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const audience = inject(AudienceService).forUrl(request.url);

  if (audience === null) {
    return next(request);
  }

  const accessTokens = inject(AccessTokenService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.Unauthorized) {
        accessTokens.invalidate(audience);
        return next(request);
      }

      return throwError(() => error);
    }),
  );
};
