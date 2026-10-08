import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '@environments/environment';
import { firstValueFrom } from 'rxjs';
import { AuthResponse } from '../models/auth';
import { SessionService } from '../services/session-service';
import { jwtInterceptor } from './jwt-interceptor';

const IDENTITY_API = `${environment.identityApiUrl}/api`;
const IDENTITY_AUDIENCE = environment.audiences.identity;

/** Respuesta de login o refresh de Identity con un token de acceso que vence en una hora. */
function authResponse(accessToken: string, refreshToken: string): AuthResponse {
  const now = Date.now();

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 3600,
    accessTokenExpiresAt: new Date(now + 3_600_000).toISOString(),
    refreshToken,
    refreshTokenExpiresAt: new Date(now + 14 * 86_400_000).toISOString(),
  };
}

/** Deja correr las promesas pendientes (la cola de renovaciones encadena varias). */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('jwtInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('envía a Identity el token de su audiencia', async () => {
    TestBed.inject(SessionService).save(
      IDENTITY_AUDIENCE,
      authResponse('identity-token-1', 'refresh-1'),
    );
    const response = firstValueFrom(client.get(`${IDENTITY_API}/auth/me`));
    await settle();

    const request = http.expectOne(`${IDENTITY_API}/auth/me`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer identity-token-1');
    request.flush({});
    await response;
  });

  it('sin token vigente lo obtiene con refresh antes de llamar', async () => {
    localStorage.setItem('tmt-bucaramanga.refresh-token', 'refresh-1');
    const response = firstValueFrom(client.get(`${IDENTITY_API}/auth/me`));
    await settle();

    const refresh = http.expectOne(`${IDENTITY_API}/auth/refresh`);
    expect(refresh.request.body).toEqual({
      refreshToken: 'refresh-1',
      audience: IDENTITY_AUDIENCE,
    });
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    refresh.flush(authResponse('identity-token-1', 'refresh-2'));
    await settle();

    const request = http.expectOne(`${IDENTITY_API}/auth/me`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer identity-token-1');
    request.flush({});
    await response;
  });

  it('no agrega token a login, registro, refresh, logout ni canje de código', async () => {
    const response = firstValueFrom(client.post(`${IDENTITY_API}/auth/login`, {}));

    const request = http.expectOne(`${IDENTITY_API}/auth/login`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(null);
    await response;
  });

  it('no agrega token a otros orígenes', async () => {
    const response = firstValueFrom(client.get('https://fonts.googleapis.com/css2'));

    const request = http.expectOne('https://fonts.googleapis.com/css2');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush('');
    await response;
  });
});
