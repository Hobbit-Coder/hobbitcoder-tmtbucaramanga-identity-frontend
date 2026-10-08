import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '@environments/environment';
import { firstValueFrom } from 'rxjs';
import { AuthResponse } from '../models/auth';
import { AccessTokenService } from './access-token-service';
import { SessionService } from './session-service';

const REFRESH_URL = `${environment.identityApiUrl}/api/auth/refresh`;
const IDENTITY_AUDIENCE = environment.audiences.identity;
/** Otra API registrada: el servicio entrega tokens para cualquier audiencia. */
const SHEEPFOLD_AUDIENCE = 'HobbitCoder.TMTBucaramanga.Sheepfold';

function authResponse(accessToken: string, refreshToken: string): AuthResponse {
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 3600,
    accessTokenExpiresAt: '',
    refreshToken,
    refreshTokenExpiresAt: '',
  };
}

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('AccessTokenService', () => {
  let accessTokens: AccessTokenService;
  let session: SessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    accessTokens = TestBed.inject(AccessTokenService);
    session = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    session.save(SHEEPFOLD_AUDIENCE, authResponse('sheepfold-token-1', 'refresh-1'));
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('entrega el token vigente sin llamar a Identity', async () => {
    await expect(firstValueFrom(accessTokens.get(SHEEPFOLD_AUDIENCE))).resolves.toBe(
      'sheepfold-token-1',
    );
  });

  it('sin token para la audiencia, lo pide a Identity con el refresh token', async () => {
    const token = firstValueFrom(accessTokens.get(IDENTITY_AUDIENCE));
    await settle();

    const refresh = http.expectOne(REFRESH_URL);
    expect(refresh.request.body).toEqual({
      refreshToken: 'refresh-1',
      audience: IDENTITY_AUDIENCE,
    });
    refresh.flush(authResponse('identity-token-1', 'refresh-2'));

    await expect(token).resolves.toBe('identity-token-1');
    expect(session.refreshToken()).toBe('refresh-2');
  });

  it('encadena las renovaciones: la segunda usa el refresh token rotado por la primera', async () => {
    accessTokens.invalidate(SHEEPFOLD_AUDIENCE);
    const identityToken = firstValueFrom(accessTokens.get(IDENTITY_AUDIENCE));
    const sheepfoldToken = firstValueFrom(accessTokens.get(SHEEPFOLD_AUDIENCE));
    await settle();

    const first = http.expectOne(REFRESH_URL);
    expect(first.request.body.refreshToken).toBe('refresh-1');
    first.flush(authResponse('identity-token-1', 'refresh-2'));
    await settle();

    const second = http.expectOne(REFRESH_URL);
    expect(second.request.body.refreshToken).toBe('refresh-2');
    second.flush(authResponse('sheepfold-token-2', 'refresh-3'));

    await expect(identityToken).resolves.toBe('identity-token-1');
    await expect(sheepfoldToken).resolves.toBe('sheepfold-token-2');
  });

  it('dos pedidos simultáneos de la misma audiencia hacen una sola renovación', async () => {
    const first = firstValueFrom(accessTokens.get(IDENTITY_AUDIENCE));
    const second = firstValueFrom(accessTokens.get(IDENTITY_AUDIENCE));
    await settle();

    http.expectOne(REFRESH_URL).flush(authResponse('identity-token-1', 'refresh-2'));
    await settle();

    await expect(first).resolves.toBe('identity-token-1');
    await expect(second).resolves.toBe('identity-token-1');
  });

  it('si Identity rechaza el refresh token, cierra la sesión', async () => {
    const token = firstValueFrom(accessTokens.get(IDENTITY_AUDIENCE));
    await settle();

    http.expectOne(REFRESH_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(token).rejects.toMatchObject({ status: 401 });
    expect(session.isAuthenticated()).toBe(false);
  });

  it('si Identity no responde, conserva la sesión', async () => {
    const token = firstValueFrom(accessTokens.get(IDENTITY_AUDIENCE));
    await settle();

    http.expectOne(REFRESH_URL).error(new ProgressEvent('error'));

    await expect(token).rejects.toMatchObject({ status: 0 });
    expect(session.isAuthenticated()).toBe(true);
  });
});
