import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '@environments/environment';
import { firstValueFrom } from 'rxjs';
import { AuthResponse } from '../models/auth';
import { SessionService } from '../services/session-service';
import { jwtInterceptor } from './jwt-interceptor';
import { refreshTokenInterceptor } from './refresh-token-interceptor';

const IDENTITY_API = `${environment.identityApiUrl}/api`;
const IDENTITY_AUDIENCE = environment.audiences.identity;
const PROFILE_URL = `${IDENTITY_API}/auth/me`;

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

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('refreshTokenInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([refreshTokenInterceptor, jwtInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    TestBed.inject(SessionService).save(
      IDENTITY_AUDIENCE,
      authResponse('identity-token-1', 'refresh-1'),
    );
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('ante un 401 renueva el token una vez y reintenta', async () => {
    const response = firstValueFrom(client.get<unknown[]>(PROFILE_URL));
    await settle();

    http.expectOne(PROFILE_URL).flush(null, { status: 401, statusText: 'Unauthorized' });
    await settle();

    http
      .expectOne(`${IDENTITY_API}/auth/refresh`)
      .flush(authResponse('identity-token-2', 'refresh-2'));
    await settle();

    const retry = http.expectOne(PROFILE_URL);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer identity-token-2');
    retry.flush([1, 2]);

    await expect(response).resolves.toEqual([1, 2]);
  });

  it('si el reintento también da 401, no vuelve a intentar', async () => {
    const response = firstValueFrom(client.get(PROFILE_URL));
    await settle();

    http.expectOne(PROFILE_URL).flush(null, { status: 401, statusText: 'Unauthorized' });
    await settle();
    http
      .expectOne(`${IDENTITY_API}/auth/refresh`)
      .flush(authResponse('identity-token-2', 'refresh-2'));
    await settle();
    http.expectOne(PROFILE_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(response).rejects.toMatchObject({ status: 401 });
  });

  it('si Identity rechaza el refresh token, cierra la sesión y lleva al login', async () => {
    const response = firstValueFrom(client.get(PROFILE_URL));
    await settle();

    http.expectOne(PROFILE_URL).flush(null, { status: 401, statusText: 'Unauthorized' });
    await settle();
    http
      .expectOne(`${IDENTITY_API}/auth/refresh`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(response).rejects.toMatchObject({ status: 401 });
    expect(TestBed.inject(SessionService).isAuthenticated()).toBe(false);
    expect(navigateByUrl).toHaveBeenCalled();
  });

  it('no reintenta otros errores', async () => {
    const response = firstValueFrom(client.get(PROFILE_URL));
    await settle();

    http.expectOne(PROFILE_URL).flush(null, { status: 403, statusText: 'Forbidden' });

    await expect(response).rejects.toMatchObject({ status: 403 });
  });
});
