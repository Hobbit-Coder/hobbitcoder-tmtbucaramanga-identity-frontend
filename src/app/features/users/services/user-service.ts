import { HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { ApiService, PagedResult, UserProfile } from '@core/index';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { GetUsersRequest, UserData, UserResponsibility } from '../models';

/**
 * Administración de cuentas (`/api/users`). La API la permite al administrador y al director; las cuentas
 * con rol Administrador solo las administra otro administrador.
 */
@Service()
export class UserService {
  private readonly _api = inject(ApiService);
  private readonly _usersUrl = `${environment.identityApiUrl}/api/users`;

  public getAll(request: GetUsersRequest): Observable<PagedResult<UserProfile>> {
    let params = new HttpParams()
      .set('pageNumber', request.pageNumber)
      .set('pageSize', request.pageSize);

    if (request.search) {
      params = params.set('search', request.search);
    }
    if (request.isActive !== undefined) {
      params = params.set('isActive', request.isActive);
    }
    if (request.role) {
      params = params.set('role', request.role);
    }

    return this._api.Get<PagedResult<UserProfile>>(this._usersUrl, params);
  }

  public getById(id: string): Observable<UserProfile> {
    return this._api.Get<UserProfile>(`${this._usersUrl}/${id}`);
  }

  /** Registra la cuenta sin contraseña. Emite su id. */
  public create(data: UserData): Observable<string> {
    return this._api.Post<UserData, string>(this._usersUrl, data);
  }

  public update(id: string, data: UserData): Observable<void> {
    return this._api.Put<UserData & { id: string }, void>(`${this._usersUrl}/${id}`, {
      ...data,
      id,
    });
  }

  /** El titular deberá confirmar su identidad y crear una contraseña nueva; se cierran sus sesiones. */
  public requestPasswordReset(id: string): Observable<void> {
    return this._api.Post<object, void>(`${this._usersUrl}/${id}/password-reset`, {});
  }

  /** Retiro ordinario: la cuenta pasa a Registros retirados y se cierran sus sesiones. */
  public retire(id: string): Observable<void> {
    return this._api.Delete<void>(`${this._usersUrl}/${id}`);
  }

  /** Responsabilidades en grupos según Sheepfold, solo para mostrarlas en el editor. */
  public getResponsibilities(id: string): Observable<UserResponsibility[]> {
    return this._api.Get<UserResponsibility[]>(
      `${environment.sheepfoldApiUrl}/api/users/${id}/responsibilities`,
    );
  }
}
