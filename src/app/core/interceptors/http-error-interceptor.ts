import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

const SERVER_ERROR_STATUS = 500;
const ERROR_DURATION_MS = 6000;

/**
 * Avisa al usuario de los errores que ninguna página puede resolver: sin conexión con el servidor
 * (status 0) o un error del servidor (5xx). Los errores de negocio (4xx) los maneja cada página, que
 * sabe qué decir. El error sigue propagándose en todos los casos.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const snackBar = inject(MatSnackBar);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const message = toGlobalErrorMessage(error.status);

        if (message !== null) {
          snackBar.open(message, 'Cerrar', {
            duration: ERROR_DURATION_MS,
            politeness: 'assertive',
          });
        }
      }

      return throwError(() => error);
    }),
  );
};

function toGlobalErrorMessage(status: number): string | null {
  if (status === 0) {
    return 'No fue posible conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  }

  return status >= SERVER_ERROR_STATUS
    ? 'Ocurrió un error en el servidor. Intenta de nuevo en unos minutos.'
    : null;
}
