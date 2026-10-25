import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEsCo from '@angular/common/locales/es-CO';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  httpActivityInterceptor,
  httpErrorInterceptor,
  jwtInterceptor,
  MINISTRY_DATE_FORMATS,
  MinistryDateAdapter,
  MinistryDatepickerIntl,
  refreshTokenInterceptor,
} from '@core/index';
import { routes } from './app.routes';

registerLocaleData(localeEsCo);

/**
 * Configuración de la aplicación. Los interceptores HTTP se ejecutan en orden: los errores globales se avisan con el
 * resultado final (después del reintento), la actividad cuenta también la renovación del token, y
 * `refreshTokenInterceptor` va antes que `jwtInterceptor` para que su reintento vuelva a pasar por él. La
 * localización es español de Colombia con íconos Material Symbols Outlined.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([
        httpErrorInterceptor,
        httpActivityInterceptor,
        refreshTokenInterceptor,
        jwtInterceptor,
      ]),
    ),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } },
    // Selector de fecha de Material (mat-datepicker).
    { provide: DateAdapter, useClass: MinistryDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MINISTRY_DATE_FORMATS },
    { provide: MatDatepickerIntl, useClass: MinistryDatepickerIntl },
  ],
};
