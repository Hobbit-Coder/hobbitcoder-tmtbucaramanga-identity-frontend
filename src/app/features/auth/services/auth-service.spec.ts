import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthorizeRequest, AuthResponse, SessionService } from '@core/index';
import { environment } from '@environments/environment';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth-service';

const AUTH_API = `${environment.identityApiUrl}/api/auth`;
const ACCOUNT_API = `${environment.identityApiUrl}/api/account`;
const IDENTITY_AUDIENCE = environment.audiences.identity;

const authResponse: AuthResponse = {
  accessToken: 'identity-token-1',
  tokenType: 'Bearer',
  expiresIn: 3600,
  accessTokenExpiresAt: '',
  refreshToken: 'refresh-1',
  refreshTokenExpiresAt: '',
};

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

  it('inicia sesión con teléfono, usuario o correo y un token para la API de Identity', async () => {
    const login = firstValueFrom(auth.login({ identifier: '3001234567', password: 'Clave#2026' }));

    const request = http.expectOne(`${AUTH_API}/login`);
    expect(request.request.body).toEqual({
      identifier: '3001234567',
      password: 'Clave#2026',
      audience: IDENTITY_AUDIENCE,
    });
    request.flush(authResponse);
    await login;

    expect(session.isAuthenticated()).toBe(true);
    expect(session.accessToken(IDENTITY_AUDIENCE)).toBe('identity-token-1');
  });

  it('pide y confirma el código de seguridad sin sesión', async () => {
    const started = firstValueFrom(auth.startVerification('ana.p', 'WhatsApp', 'Activation'));
    const start = http.expectOne(`${ACCOUNT_API}/verification`);
    expect(start.request.body).toEqual({
      identifier: 'ana.p',
      channel: 'WhatsApp',
      purpose: 'Activation',
    });
    start.flush({ verificationId: 'v-1' });
    await expect(started).resolves.toBe('v-1');

    const confirmed = firstValueFrom(auth.confirmVerification('v-1', '123456'));
    const confirm = http.expectOne(`${ACCOUNT_API}/verification/confirm`);
    expect(confirm.request.body).toEqual({ verificationId: 'v-1', code: '123456' });
    confirm.flush({ verificationToken: 'token-1' });
    await expect(confirmed).resolves.toBe('token-1');
  });

  it('activa la cuenta con la contraseña y el perfil en una sola petición', async () => {
    const profile = {
      firstName: 'Ana',
      lastName: 'Pérez',
      gender: 'Female' as const,
      phoneNumber: '3001234567',
      email: null,
      userName: 'ana.p',
      instagram: 'ana.p',
      birthDate: '2008-03-15',
    };
    const activated = firstValueFrom(auth.activate('token-1', 'Clave#2026', profile), {
      defaultValue: undefined,
    });

    const request = http.expectOne(`${ACCOUNT_API}/activation`);
    expect(request.request.body).toEqual({
      verificationToken: 'token-1',
      password: 'Clave#2026',
      ...profile,
    });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await activated;
  });

  it('crea una contraseña nueva con el token de verificación', async () => {
    const reset = firstValueFrom(auth.resetPassword('token-2', 'Nueva#2026'), {
      defaultValue: undefined,
    });

    const request = http.expectOne(`${ACCOUNT_API}/password`);
    expect(request.request.body).toEqual({ verificationToken: 'token-2', password: 'Nueva#2026' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await reset;
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
