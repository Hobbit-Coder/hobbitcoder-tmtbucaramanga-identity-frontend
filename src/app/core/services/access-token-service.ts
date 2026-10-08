import { HttpStatusCode } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '@environments/environment';
import { defer, firstValueFrom, Observable, of } from 'rxjs';
import { AuthResponse, RefreshRequest } from '../models/auth';
import { ProblemDetails } from '../models/problem-details';
import { ApiService } from './api-service';
import { SessionService } from './session-service';

/**
 * Entrega el token de acceso de cada audiencia: el vigente en memoria o uno nuevo que pide a
 * Identity con el refresh token.
 *
 * Identity revoca toda la sesión si recibe un refresh token que ya se rotó. Por eso las
 * renovaciones van en serie (dentro de la pestaña con una cola y entre pestañas con la Web Locks
 * API) y cada una usa el refresh token más reciente.
 */
@Service()
export class AccessTokenService {
  private readonly _api = inject(ApiService);
  private readonly _session = inject(SessionService);
  private readonly _refreshUrl = `${environment.identityApiUrl}/api/auth/refresh`;
  private _refreshQueue: Promise<unknown> = Promise.resolve();

  /** Nombre del candado que comparten las pestañas para renovar la sesión de una en una. */
  private readonly _refreshLockName = 'tmt-bucaramanga.refresh-session';

  public get(audience: string): Observable<string> {
    const accessToken = this._session.accessToken(audience);

    return accessToken !== null ? of(accessToken) : defer(() => this.enqueueRefresh(audience));
  }

  /** Descarta el token de la audiencia (por ejemplo, porque la API lo rechazó) para pedir otro. */
  public invalidate(audience: string): void {
    this._session.invalidateAccessToken(audience);
  }

  private enqueueRefresh(audience: string): Promise<string> {
    const refresh = this._refreshQueue.then(() =>
      this.withCrossTabLock(() => this.refresh(audience)),
    );
    this._refreshQueue = refresh.catch(() => undefined);

    return refresh;
  }

  private async refresh(audience: string): Promise<string> {
    // Una renovación anterior de la cola pudo dejar listo el token de esta audiencia.
    const accessToken = this._session.accessToken(audience);
    if (accessToken !== null) {
      return accessToken;
    }

    const refreshToken = this._session.refreshToken();
    if (refreshToken === null) {
      this._session.expire();
      throw new Error('No hay una sesión iniciada en Identity.');
    }

    try {
      const response = await firstValueFrom(
        this._api.Post<RefreshRequest, AuthResponse>(this._refreshUrl, { refreshToken, audience }),
      );
      this._session.save(audience, response);

      return response.accessToken;
    } catch (error) {
      if ((error as ProblemDetails).status === HttpStatusCode.Unauthorized) {
        this._session.expire();
      }

      throw error;
    }
  }

  /** Ejecuta la tarea con el candado entre pestañas; sin Web Locks API, solo con la cola local. */
  private withCrossTabLock<T>(task: () => Promise<T>): Promise<T> {
    const locks = globalThis.navigator?.locks;

    return locks ? locks.request(this._refreshLockName, task) : task();
  }
}
