import { inject, Service } from '@angular/core';
import {
  ApiService,
  AuthorizeRequest,
  AuthorizeResponse,
  AuthResponse,
  CurrentUser,
  LoginCredentials,
  LoginRequest,
  LogoutRequest,
  RegisterRequest,
  SessionService,
} from '@core/index';
import { environment } from '@environments/environment';
import { catchError, finalize, map, Observable, of, switchMap } from 'rxjs';

/**
 * Cuenta del usuario en Identity: inicio y cierre de sesión, registro, perfil y la autorización de
 * las aplicaciones cliente (como Sheepfold) que entran con esta sesión.
 */
@Service()
export class AuthService {
  private readonly _api = inject(ApiService);
  private readonly _session = inject(SessionService);
  private readonly _authUrl = `${environment.identityApiUrl}/api/auth`;

  /** Inicia sesión en Identity con un token de acceso para la propia API de Identity. */
  public login(credentials: LoginCredentials): Observable<void> {
    const audience = environment.audiences.identity;

    return this._api
      .Post<LoginRequest, AuthResponse>(`${this._authUrl}/login`, { ...credentials, audience })
      .pipe(map((response) => this._session.save(audience, response)));
  }

  /** Crea la cuenta (activa y sin roles) e inicia sesión con ella. */
  public register(request: RegisterRequest): Observable<void> {
    return this._api
      .Post<RegisterRequest, string>(`${this._authUrl}/register`, request)
      .pipe(switchMap(() => this.login({ email: request.email, password: request.password })));
  }

  /**
   * Revoca la sesión en Identity (también en las aplicaciones que entraron con ella) y la cierra aquí
   * aunque Identity no responda.
   */
  public logout(): Observable<void> {
    const refreshToken = this._session.refreshToken();

    if (refreshToken === null) {
      this._session.end();
      return of(undefined);
    }

    return this._api.Post<LogoutRequest, void>(`${this._authUrl}/logout`, { refreshToken }).pipe(
      catchError(() => of(undefined)),
      finalize(() => this._session.end()),
    );
  }

  public getCurrentUser(): Observable<CurrentUser> {
    return this._api.Get<CurrentUser>(`${this._authUrl}/me`);
  }

  /** Autoriza a una aplicación cliente con la sesión actual; emite la URI a la que debe volver. */
  public authorize(request: AuthorizeRequest): Observable<string> {
    return this._api
      .Post<AuthorizeRequest, AuthorizeResponse>(`${this._authUrl}/authorize`, request)
      .pipe(map((response) => response.redirectUri));
  }
}
