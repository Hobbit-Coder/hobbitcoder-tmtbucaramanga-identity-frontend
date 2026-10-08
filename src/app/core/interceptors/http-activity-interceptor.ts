import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { HttpActivityService } from '../services/http-activity-service';

/** Cuenta cada petición mientras está en curso, para mostrar la barra de progreso sin código extra. */
export const httpActivityInterceptor: HttpInterceptorFn = (request, next) => {
  const httpActivity = inject(HttpActivityService);
  httpActivity.started();

  return next(request).pipe(finalize(() => httpActivity.finished()));
};
