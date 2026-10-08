/** Cuerpo de `POST /api/auth/register`: registro público, sin roles. */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
}

/**
 * Cuerpo de `POST /api/auth/authorize`: la aplicación cliente que pide entrar con la sesión de
 * Identity y su desafío PKCE. Llega en la query de `/auth/authorize` (OAuth 2.0).
 */
export interface AuthorizeRequest {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string;
}

/** Respuesta de `POST /api/auth/authorize`: la URI del cliente con `code` y `state`. */
export interface AuthorizeResponse {
  redirectUri: string;
}

/** Datos de `POST /api/auth/login` en Identity (la audiencia la agrega `AuthService`). */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Cuerpo de `POST /api/auth/login`: las credenciales y la audiencia del token que se pide. */
export interface LoginRequest extends LoginCredentials {
  audience: string;
}

/** Cuerpo de `POST /api/auth/refresh`. */
export interface RefreshRequest {
  refreshToken: string;
  audience: string;
}

/** Cuerpo de `POST /api/auth/logout`. */
export interface LogoutRequest {
  refreshToken: string;
}

/** Respuesta de `login` y `refresh` en Identity. */
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

/** Perfil del usuario autenticado (`GET /api/auth/me` en Identity). */
export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  emailConfirmed: boolean;
  roles: string[];
}
