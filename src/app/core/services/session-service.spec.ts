import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthResponse } from '../models/auth';
import { SessionService } from './session-service';

const AUDIENCE = 'HobbitCoder.TMTBucaramanga.Identity';
const REFRESH_TOKEN_KEY = 'tmt-bucaramanga.refresh-token';

function authResponse(accessToken: string, refreshToken: string, expiresIn = 3600): AuthResponse {
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn,
    accessTokenExpiresAt: '',
    refreshToken,
    refreshTokenExpiresAt: '',
  };
}

describe('SessionService', () => {
  let session: SessionService;
  let router: Router;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    session = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
    navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => localStorage.clear());

  it('sin refresh token no hay sesión', () => {
    expect(session.isAuthenticated()).toBe(false);
    expect(session.refreshToken()).toBeNull();
  });

  it('guarda el refresh token en localStorage y el token de acceso solo en memoria', () => {
    session.save(AUDIENCE, authResponse('access-1', 'refresh-1'));

    expect(session.isAuthenticated()).toBe(true);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-1');
    expect(session.accessToken(AUDIENCE)).toBe('access-1');
    expect(JSON.stringify(localStorage)).not.toContain('access-1');
  });

  it('da por vencido el token de acceso 30 segundos antes de su exp', () => {
    session.save(AUDIENCE, authResponse('access-1', 'refresh-1', 30));

    expect(session.accessToken(AUDIENCE)).toBeNull();
  });

  it('lee el refresh token que otra pestaña rotó', () => {
    session.save(AUDIENCE, authResponse('access-1', 'refresh-1'));
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-2');

    expect(session.refreshToken()).toBe('refresh-2');
  });

  it('al cerrar la sesión borra los tokens y lleva al login', () => {
    session.save(AUDIENCE, authResponse('access-1', 'refresh-1'));

    session.end();

    expect(session.isAuthenticated()).toBe(false);
    expect(session.accessToken(AUDIENCE)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(router.serializeUrl(navigateByUrl.mock.calls[0][0])).toBe('/auth/sign-in');
  });

  it('toma los roles del token de acceso y los olvida al cerrar la sesión', () => {
    const payload = btoa(JSON.stringify({ role: ['Admin'] }));
    session.save(AUDIENCE, authResponse(`encabezado.${payload}.firma`, 'refresh-1'));

    expect(session.roles()).toEqual(['Admin']);

    session.end();

    expect(session.roles()).toBeNull();
  });

  it('si otra pestaña cierra la sesión, la cierra aquí también', () => {
    session.save(AUDIENCE, authResponse('access-1', 'refresh-1'));
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    globalThis.dispatchEvent(
      new StorageEvent('storage', { key: REFRESH_TOKEN_KEY, newValue: null }),
    );

    expect(session.isAuthenticated()).toBe(false);
    expect(session.accessToken(AUDIENCE)).toBeNull();
    expect(navigateByUrl).toHaveBeenCalled();
  });

  it('si otra pestaña inicia sesión, queda autenticada aquí también', () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-1');

    globalThis.dispatchEvent(
      new StorageEvent('storage', { key: REFRESH_TOKEN_KEY, newValue: 'refresh-1' }),
    );

    expect(session.isAuthenticated()).toBe(true);
  });
});
