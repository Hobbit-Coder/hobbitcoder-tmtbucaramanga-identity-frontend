import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AccessTokenService } from './access-token-service';
import { AudienceService } from './audience-service';
import { SessionService } from './session-service';

/**
 * Roles del usuario autenticado para decidir qué mostrar o a qué rutas dejar entrar. No reemplaza la
 * autorización de las APIs, que validan el token y sus roles en cada petición.
 */
@Service()
export class UserRolesService {
  private readonly _session = inject(SessionService);
  private readonly _accessTokens = inject(AccessTokenService);
  private readonly _audiences = inject(AudienceService);

  /** `null` mientras no se conozcan (sin sesión o antes del primer token de acceso). */
  public readonly roles = this._session.roles;

  /** Indica si el usuario tiene alguno de los roles. Mientras no se conozcan, no tiene ninguno. */
  public hasAnyRole(allowedRoles: readonly string[]): boolean {
    const roles = this.roles();

    return roles !== null && allowedRoles.some((role) => roles.includes(role));
  }

  /** Como `hasAnyRole`, pero antes asegura un token de acceso, y con él los roles. */
  public hasAnyRoleAsync(allowedRoles: readonly string[]): Observable<boolean> {
    return this._accessTokens
      .get(this._audiences.appAudience)
      .pipe(map(() => this.hasAnyRole(allowedRoles)));
  }

  /**
   * Con sesión pero sin roles conocidos (por ejemplo, después de recargar), pide un token para
   * conocerlos. Si la sesión ya no es válida, `AccessTokenService` la cierra.
   */
  public ensureLoaded(): void {
    if (this._session.isAuthenticated() && this.roles() === null) {
      this._accessTokens.get(this._audiences.appAudience).subscribe({ error: () => undefined });
    }
  }
}
