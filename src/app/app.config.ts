import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEsCo from '@angular/common/locales/es-CO';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  httpActivityInterceptor,
  httpErrorInterceptor,
  jwtInterceptor,
  refreshTokenInterceptor,
} from '@core/index';
import { routes } from './app.routes';

registerLocaleData(localeEsCo);

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
    // Español de Colombia para fechas y números (manual §8) e íconos Material Symbols Outlined (§7).
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } },
  ],
};
