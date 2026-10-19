import { AccessStatus, Gender, UserRole } from './role';

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

/** Datos de `POST /api/auth/login`: teléfono, nombre de usuario o correo registrado. */
export interface LoginCredentials {
  identifier: string;
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

/** Cuenta tal como la devuelve Identity (`UserResponse`): `/api/auth/me` y `/api/users`. */
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender | null;
  phoneNumber: string | null;
  email: string | null;
  userName: string;
  instagram: string | null;
  birthDate: string | null;
  /** Calculada por Identity a partir de la fecha de nacimiento. */
  age: number | null;
  role: UserRole;
  isActive: boolean;
  canRegisterAttendees: boolean;
  accessStatus: AccessStatus;
  lockoutEnd: string | null;
  createdDate: string;
  deletedAt: string | null;
}

/** Perfil que el titular completa al activar su cuenta o edita en Mi perfil. */
export interface ProfileData {
  firstName: string;
  lastName: string;
  gender: Gender | null;
  phoneNumber: string;
  email: string | null;
  userName: string;
  instagram: string | null;
  birthDate: string | null;
}

export type VerificationChannel = 'Sms' | 'WhatsApp';
export type VerificationPurpose = 'Activation' | 'Recovery';
