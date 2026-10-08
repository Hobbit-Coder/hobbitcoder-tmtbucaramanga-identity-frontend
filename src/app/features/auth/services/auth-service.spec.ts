import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthorizeRequest, AuthResponse, SessionService } from '@core/index';
import { environment } from '@environments/environment';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth-service';

const AUTH_API = `${environment.identityApiUrl}/api/auth`;
const IDENTITY_AUDIENCE = environment.audiences.identity;

const authResponse: AuthResponse = {
  accessToken: 'identity-token-1',
  tokenType: 'Bearer',
  expiresIn: 3600,
  accessTokenExpiresAt: '',
  refreshToken: 'refresh-1',
  refreshTokenExpiresAt: '',
};

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('AuthService', () => {
  let auth: AuthService;
  let session: SessionService;
  let http: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
    session = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('inicia sesión con un token para la API de Identity', async () => {
    const login = firstValueFrom(auth.login({ email: 'ana@example.com', password: 'Clave#2026' }));

    const request = http.expectOne(`${AUTH_API}/login`);
    expect(request.request.body).toEqual({
      email: 'ana@example.com',
      password: 'Clave#2026',
      audience: IDENTITY_AUDIENCE,
    });
    request.flush(authResponse);
    await login;

    expect(session.isAuthenticated()).toBe(true);
    expect(session.accessToken(IDENTITY_AUDIENCE)).toBe('identity-token-1');
  });

  it('al registrarse crea la cuenta e inicia sesión con ella', async () => {
    const register = firstValueFrom(
      auth.register({
        email: 'ana@example.com',
        password: 'Clave#2026',
        firstName: 'Ana',
        lastName: 'Pérez',
        phoneNumber: null,
      }),
    );

    http.expectOne(`${AUTH_API}/register`).flush('01a0fd28-eb05-7fba-8260-b2345d93bcec', {
      status: 201,
      statusText: 'Created',
    });
    await settle();
    const login = http.expectOne(`${AUTH_API}/login`);
    expect(login.request.body.email).toBe('ana@example.com');
    login.flush(authResponse);
    await register;

    expect(session.isAuthenticated()).toBe(true);
  });

  it('si el registro falla no intenta iniciar sesión', async () => {
    const register = firstValueFrom(
      auth.register({
        email: 'ana@example.com',
        password: 'Clave#2026',
        firstName: 'Ana',
        lastName: 'Pérez',
        phoneNumber: null,
      }),
    );

    http.expectOne(`${AUTH_API}/register`).flush(null, { status: 409, statusText: 'Conflict' });

    await expect(register).rejects.toMatchObject({ status: 409 });
  });

  it('autoriza a una aplicación cliente y emite la URI a la que debe volver', async () => {
    const request: AuthorizeRequest = {
      clientId: 'sheepfold-web',
      redirectUri: 'http://localhost:4200/auth/callback',
      codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
      codeChallengeMethod: 'S256',
      state: 'estado',
    };
    const redirectUri = firstValueFrom(auth.authorize(request));

    const authorize = http.expectOne(`${AUTH_API}/authorize`);
    expect(authorize.request.body).toEqual(request);
    authorize.flush({ redirectUri: 'http://localhost:4200/auth/callback?code=abc&state=estado' });

    await expect(redirectUri).resolves.toBe(
      'http://localhost:4200/auth/callback?code=abc&state=estado',
    );
  });

  it('al cerrar sesión revoca el refresh token en Identity y lleva al login', async () => {
    session.save(IDENTITY_AUDIENCE, authResponse);
    const logout = firstValueFrom(auth.logout(), { defaultValue: undefined });

    const request = http.expectOne(`${AUTH_API}/logout`);
    expect(request.request.body).toEqual({ refreshToken: 'refresh-1' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await logout;

    expect(session.isAuthenticated()).toBe(false);
    expect(navigateByUrl).toHaveBeenCalled();
  });
});
