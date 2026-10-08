import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthResponse } from '../models/auth';
import { Role } from '../models/role';
import { AudienceService } from './audience-service';
import { SessionService } from './session-service';
import { UserRolesService } from './user-roles-service';

const REFRESH_TOKEN_KEY = 'tmt-bucaramanga.refresh-token';

/** Respuesta de Identity con un token de acceso cuyo claim `role` trae los roles indicados. */
function authResponse(roles: string[]): AuthResponse {
  const payload = btoa(JSON.stringify({ sub: '1', role: roles }));

  return {
    accessToken: `encabezado.${payload}.firma`,
    tokenType: 'Bearer',
    expiresIn: 3600,
    accessTokenExpiresAt: '',
    refreshToken: 'refresh-2',
    refreshTokenExpiresAt: '',
  };
}

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('UserRolesService', () => {
  let userRoles: UserRolesService;
  let session: SessionService;
  let http: HttpTestingController;
  let appAudience: string;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    userRoles = TestBed.inject(UserRolesService);
    session = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
    appAudience = TestBed.inject(AudienceService).appAudience;
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('sin token no conoce los roles ni concede ninguno', () => {
    expect(userRoles.roles()).toBeNull();
    expect(userRoles.hasAnyRole([Role.Admin])).toBe(false);
  });

  it('lee los roles del último token recibido', () => {
    session.save(appAudience, authResponse([Role.Admin]));

    expect(userRoles.roles()).toEqual([Role.Admin]);
    expect(userRoles.hasAnyRole([Role.Admin, 'Otro'])).toBe(true);
    expect(userRoles.hasAnyRole(['Otro'])).toBe(false);
  });

  it('después de recargar renueva el token para conocer los roles', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-1');
    const isAllowed = firstValueFrom(userRoles.hasAnyRoleAsync([Role.Admin]));
    await settle();

    const refresh = http.expectOne((request) => request.url.endsWith('/api/auth/refresh'));
    expect(refresh.request.body.audience).toBe(appAudience);
    refresh.flush(authResponse([Role.Admin]));

    await expect(isAllowed).resolves.toBe(true);
  });

  it('ensureLoaded no pide nada sin sesión', () => {
    userRoles.ensureLoaded();

    http.expectNone((request) => request.url.endsWith('/api/auth/refresh'));
  });
});
