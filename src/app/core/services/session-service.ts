import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthResponse } from '../models/auth';
import { JwtService } from './jwt-service';
import { LocalStorageService } from './local-storage-service';
import { SignInUrlService } from './sign-in-url-service';

interface CachedAccessToken {
  value: string;
  expiresAt: number;
}

/**
 * Estado de la sesión iniciada en Identity. El refresh token se guarda en `localStorage` para
 * sobrevivir a recargas; los tokens de acceso, uno por audiencia, solo viven en memoria, igual que
 * los roles del usuario que traen. Cerrar la sesión en una pestaña la cierra en las demás.
 */
@Service()
export class SessionService {
  private readonly _refreshTokenKey = 'tmt-bucaramanga.refresh-token';

  /** Un token de acceso se da por vencido este tiempo antes de su `exp`, para renovarlo a tiempo. */
  private readonly _accessTokenRenewalMarginMs = 30_000;

  private readonly _storage = inject(LocalStorageService);
  private readonly _router = inject(Router);
  private readonly _jwt = inject(JwtService);
  private readonly _signInUrl = inject(SignInUrlService);
  private readonly _accessTokens = new Map<string, CachedAccessToken>();
  private readonly _refreshToken = signal(this._storage.get(this._refreshTokenKey));
  private readonly _roles = signal<readonly string[] | null>(null);

  public readonly isAuthenticated = computed(() => this._refreshToken() !== null);

  /**
   * Roles del usuario según el último token de acceso recibido. `null` mientras no se haya recibido
   * ninguno (sin sesión, o después de recargar hasta la primera renovación).
   */
  public readonly roles = this._roles.asReadonly();

  constructor() {
    const onStorage = (event: StorageEvent) => this.onStorageChanged(event);

    globalThis.addEventListener?.('storage', onStorage);
    inject(DestroyRef).onDestroy(() => globalThis.removeEventListener?.('storage', onStorage));
  }

  /**
   * El refresh token más reciente. Se lee del almacenamiento porque otra pestaña puede haberlo
   * rotado hace un instante; si el almacenamiento no está disponible, la sesión solo vive en memoria.
   */
  public refreshToken(): string | null {
    return this._storage.get(this._refreshTokenKey) ?? this._refreshToken();
  }

  /** Token de acceso vigente para la audiencia, o `null` si no hay o está por vencer. */
  public accessToken(audience: string): string | null {
    const token = this._accessTokens.get(audience);
    const isValid = !!token && token.expiresAt - this._accessTokenRenewalMarginMs > Date.now();

    return isValid ? token.value : null;
  }

  /** Guarda el resultado de un login o de un refresh: el refresh token rotado y el token de acceso. */
  public save(audience: string, response: AuthResponse): void {
    this._storage.set(this._refreshTokenKey, response.refreshToken);
    this._refreshToken.set(response.refreshToken);
    this._accessTokens.set(audience, {
      value: response.accessToken,
      expiresAt: Date.now() + response.expiresIn * 1000,
    });
    this._roles.set(this._jwt.readRoles(response.accessToken));
  }

  public invalidateAccessToken(audience: string): void {
    this._accessTokens.delete(audience);
  }

  /** Cierra la sesión (en todas las pestañas) y lleva al login. */
  public end(): void {
    this.clear();
    void this._router.navigateByUrl(this._signInUrl.signInUrlTree());
  }

  /** Identity ya no acepta la sesión: la cierra y lleva al login recordando la página actual. */
  public expire(): void {
    this.clear();
    void this._router.navigateByUrl(this._signInUrl.signInUrlTree(this._router.url));
  }

  private clear(): void {
    this._storage.remove(this._refreshTokenKey);
    this._refreshToken.set(null);
    this._accessTokens.clear();
    this._roles.set(null);
  }

  /** Otra pestaña inició, renovó o cerró la sesión. `key` es `null` si se vació el almacenamiento. */
  private onStorageChanged(event: StorageEvent): void {
    if (event.key !== this._refreshTokenKey && event.key !== null) {
      return;
    }

    const refreshToken = this._storage.get(this._refreshTokenKey);

    if (refreshToken === null && this.isAuthenticated()) {
      this.expire();
      return;
    }

    this._refreshToken.set(refreshToken);
  }
}
