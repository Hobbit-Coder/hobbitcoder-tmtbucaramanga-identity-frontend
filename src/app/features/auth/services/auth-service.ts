import { inject, Service } from '@angular/core';
import {
  ApiService,
  AuthorizeRequest,
  AuthorizeResponse,
  AuthResponse,
  LoginCredentials,
  LoginRequest,
  LogoutRequest,
  ProfileData,
  SessionService,
  UserProfile,
  VerificationChannel,
  VerificationPurpose,
} from '@core/index';
import { environment } from '@environments/environment';
import { catchError, finalize, map, Observable, of } from 'rxjs';

/**
 * Cuenta del usuario en Identity: inicio y cierre de sesión, primer ingreso y recuperación con código de
 * seguridad, perfil propio y la autorización de las aplicaciones cliente (como Sheepfold).
 */
@Service()
export class AuthService {
  private readonly _api = inject(ApiService);
  private readonly _session = inject(SessionService);
  private readonly _authUrl = `${environment.identityApiUrl}/api/auth`;
  private readonly _accountUrl = `${environment.identityApiUrl}/api/account`;

  /** Inicia sesión con teléfono, usuario o correo registrado, con un token para la propia API de Identity. */
  public login(credentials: LoginCredentials): Observable<void> {
    const audience = environment.audiences.identity;

    return this._api
      .Post<LoginRequest, AuthResponse>(`${this._authUrl}/login`, { ...credentials, audience })
      .pipe(map((response) => this._session.save(audience, response)));
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

  public getCurrentUser(): Observable<UserProfile> {
    return this._api.Get<UserProfile>(`${this._authUrl}/me`);
  }

  public updateProfile(profile: ProfileData): Observable<void> {
    return this._api.Put<ProfileData, void>(`${this._authUrl}/me`, profile);
  }

  /** Cambia la contraseña propia; Identity cierra todas las sesiones. */
  public changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this._api.Post<{ currentPassword: string; newPassword: string }, void>(
      `${this._authUrl}/change-password`,
      {
        currentPassword,
        newPassword,
      },
    );
  }

  /** Autoriza a una aplicación cliente con la sesión actual; emite la URI a la que debe volver. */
  public authorize(request: AuthorizeRequest): Observable<string> {
    return this._api
      .Post<AuthorizeRequest, AuthorizeResponse>(`${this._authUrl}/authorize`, request)
      .pipe(map((response) => response.redirectUri));
  }

  /**
   * Pide el código de seguridad al teléfono de la cuenta. Identity responde igual exista o no la cuenta;
   * emite el id de la verificación.
   */
  public startVerification(
    identifier: string,
    channel: VerificationChannel,
    purpose: VerificationPurpose,
  ): Observable<string> {
    return this._api
      .Post<object, { verificationId: string }>(`${this._accountUrl}/verification`, {
        identifier,
        channel,
        purpose,
      })
      .pipe(map((response) => response.verificationId));
  }

  /** Confirma el código; emite el token de verificación para crear la contraseña. */
  public confirmVerification(verificationId: string, code: string): Observable<string> {
    return this._api
      .Post<object, { verificationToken: string }>(`${this._accountUrl}/verification/confirm`, {
        verificationId,
        code,
      })
      .pipe(map((response) => response.verificationToken));
  }

  /** Datos que la administración ya registró para la cuenta en activación. */
  public getActivationProfile(verificationToken: string): Observable<UserProfile> {
    return this._api.Post<object, UserProfile>(`${this._accountUrl}/activation/profile`, {
      verificationToken,
    });
  }

  /** Crea la contraseña y completa el perfil en un solo paso: la cuenta queda activada. */
  public activate(
    verificationToken: string,
    password: string,
    profile: ProfileData,
  ): Observable<void> {
    return this._api.Post<object, void>(`${this._accountUrl}/activation`, {
      verificationToken,
      password,
      ...profile,
    });
  }

  /** Crea una contraseña nueva (recuperación o reinicio solicitado por la administración). */
  public resetPassword(verificationToken: string, password: string): Observable<void> {
    return this._api.Post<object, void>(`${this._accountUrl}/password`, {
      verificationToken,
      password,
    });
  }
}
