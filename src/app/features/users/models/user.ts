/** Usuario de `GET /api/users` y `GET /api/users/{id}`. */
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  emailConfirmed: boolean;
  /** Fin del bloqueo por intentos fallidos; `null` si no está bloqueado. */
  lockoutEnd: string | null;
  createdDate: string;
  roles: string[];
}

/** Filtros y página de `GET /api/users`. */
export interface GetUsersRequest {
  search?: string;
  isActive?: boolean;
  role?: string;
  pageNumber: number;
  pageSize: number;
}

/** Datos que comparten el alta y la edición. `roles` reemplaza los actuales. */
export interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  emailConfirmed: boolean;
  roles: string[];
}

/** Cuerpo de `POST /api/users`. */
export interface CreateUserRequest extends UserData {
  password: string;
}

/** Cuerpo de `PUT /api/users/{id}`. */
export interface UpdateUserRequest extends UserData {
  id: string;
}

/** Cuerpo de `PUT /api/users/{id}/password`. */
export interface SetUserPasswordRequest {
  id: string;
  newPassword: string;
}
