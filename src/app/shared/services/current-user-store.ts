import { inject, Service } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { SessionService } from '@core/index';
import { AuthService } from '@features/auth/services/auth-service';

/**
 * Cuenta de la sesión actual (`/api/auth/me`), compartida por la barra, el menú y Mi perfil. Se vuelve a
 * consultar al iniciar otra sesión y queda vacía al cerrarla.
 */
@Service()
export class CurrentUserStore {
  private readonly _auth = inject(AuthService);
  private readonly _session = inject(SessionService);

  public readonly user = rxResource({
    params: () => (this._session.isAuthenticated() ? true : undefined),
    stream: () => this._auth.getCurrentUser(),
  });

  public reload(): void {
    this.user.reload();
  }
}
