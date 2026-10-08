import { Service } from '@angular/core';
import { environment } from '@environments/environment';

/** Audiencia del token de acceso que necesita cada petición: `/api/...` es la API de Identity. */
@Service()
export class AudienceService {
  private readonly _identityApi = `${environment.identityApiUrl}/api/`;

  /** Endpoints de Identity que no llevan token: sirven justamente para obtenerlo o descartarlo. */
  private readonly _anonymousIdentityEndpoints = [
    'auth/login',
    'auth/register',
    'auth/refresh',
    'auth/logout',
    'auth/token',
  ].map((endpoint) => `${this._identityApi}${endpoint}`);

  /** Audiencia de la API de esta aplicación: sus tokens son los que traen los roles del usuario. */
  public readonly appAudience = environment.audiences.identity;

  /** Audiencia del token de acceso que necesita la petición, o `null` si no debe llevar token. */
  public forUrl(url: string): string | null {
    const path = url.split('?')[0];

    if (!path.startsWith(this._identityApi)) {
      return null;
    }

    return this._anonymousIdentityEndpoints.includes(path) ? null : this.appAudience;
  }
}
