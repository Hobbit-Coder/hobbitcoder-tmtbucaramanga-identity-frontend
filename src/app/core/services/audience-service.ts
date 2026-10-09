import { Service } from '@angular/core';
import { environment } from '@environments/environment';

/**
 * Audiencia del token de acceso que necesita cada petición: `/api/...` es la API de Identity y
 * `{sheepfoldApiUrl}/api/...` la de Sheepfold (responsabilidades en grupos al editar una cuenta).
 */
@Service()
export class AudienceService {
  private readonly _identityApi = `${environment.identityApiUrl}/api/`;
  private readonly _sheepfoldApi = `${environment.sheepfoldApiUrl}/api/`;

  /**
   * Endpoints de Identity que no llevan token: sirven para obtenerlo o descartarlo, o son los procesos de
   * seguridad del titular sin sesión (primer ingreso y recuperación).
   */
  private readonly _anonymousIdentityEndpoints = [
    'auth/login',
    'auth/refresh',
    'auth/logout',
    'auth/token',
    'account/verification',
    'account/verification/confirm',
    'account/activation',
    'account/activation/profile',
    'account/password',
  ].map((endpoint) => `${this._identityApi}${endpoint}`);

  /** Audiencia de la API de esta aplicación: sus tokens son los que traen los roles del usuario. */
  public readonly appAudience = environment.audiences.identity;

  /** Audiencia del token de acceso que necesita la petición, o `null` si no debe llevar token. */
  public forUrl(url: string): string | null {
    const path = url.split('?')[0];

    if (path.startsWith(this._sheepfoldApi)) {
      return environment.audiences.sheepfold;
    }

    if (!path.startsWith(this._identityApi)) {
      return null;
    }

    return this._anonymousIdentityEndpoints.includes(path) ? null : this.appAudience;
  }
}
