import { HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { ApiService, PagedResult } from '@core/index';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import {
  CreateUserRequest,
  GetUsersRequest,
  SetUserPasswordRequest,
  UpdateUserRequest,
  UserResponse,
} from '../models';

/** Administración de usuarios (`/api/users`). La API exige el rol Admin. */
@Service()
export class UserService {
  private readonly _api = inject(ApiService);
  private readonly _usersUrl = `${environment.identityApiUrl}/api/users`;

  public getAll(request: GetUsersRequest): Observable<PagedResult<UserResponse>> {
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

    return this._api.Get<PagedResult<UserResponse>>(this._usersUrl, params);
  }

  public getById(id: string): Observable<UserResponse> {
    return this._api.Get<UserResponse>(`${this._usersUrl}/${id}`);
  }

  /** Emite el id del usuario creado. */
  public create(request: CreateUserRequest): Observable<string> {
    return this._api.Post<CreateUserRequest, string>(this._usersUrl, request);
  }

  public update(request: UpdateUserRequest): Observable<void> {
    return this._api.Put<UpdateUserRequest, void>(`${this._usersUrl}/${request.id}`, request);
  }

  /** Asigna una contraseña nueva, desbloquea la cuenta y cierra sus sesiones. */
  public setPassword(request: SetUserPasswordRequest): Observable<void> {
    return this._api.Put<SetUserPasswordRequest, void>(
      `${this._usersUrl}/${request.id}/password`,
      request,
    );
  }

  /** Borrado lógico; cierra sus sesiones. */
  public delete(id: string): Observable<void> {
    return this._api.Delete<void>(`${this._usersUrl}/${id}`);
  }
}
