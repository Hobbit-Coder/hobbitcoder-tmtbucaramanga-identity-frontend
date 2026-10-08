import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  httpActivityInterceptor,
  httpErrorInterceptor,
  jwtInterceptor,
  refreshTokenInterceptor,
} from '@core/index';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Orden: los errores globales se avisan con el resultado final (después del reintento), la
    // actividad cuenta también la renovación del token, y refreshTokenInterceptor va antes que
    // jwtInterceptor para que su reintento vuelva a pasar por él.
    provideHttpClient(
      withInterceptors([
        httpErrorInterceptor,
        httpActivityInterceptor,
        refreshTokenInterceptor,
        jwtInterceptor,
      ]),
    ),
  ],
};
