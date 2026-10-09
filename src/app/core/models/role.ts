/**
 * Roles que Identity emite en el claim `role` del token (§3.1): uno por cuenta, con los mismos nombres en
 * Identity y en Sheepfold.
 */
export const Role = {
  Admin: 'Admin',
  Director: 'Director',
  Coordinator: 'Coordinator',
  Leader: 'Leader',
  Apprentice: 'Apprentice',
} as const;

export type UserRole = (typeof Role)[keyof typeof Role];

/** Mismo tipo que `UserRole`, con el nombre que usan los guards y directivas existentes. */
export type Role = UserRole;

export const ROLE_LABELS: Record<UserRole, string> = {
  Admin: 'Administrador',
  Director: 'Director',
  Coordinator: 'Coordinador',
  Leader: 'Líder',
  Apprentice: 'Aprendiz',
};

export type Gender = 'Female' | 'Male';

export const GENDER_LABELS: Record<Gender, string> = {
  Female: 'Femenino',
  Male: 'Masculino',
};

/** Estado del acceso de la cuenta, derivado por Identity. */
export type AccessStatus = 'PendingActivation' | 'Ready' | 'PasswordResetRequested';

export const ACCESS_STATUS_LABELS: Record<AccessStatus, string> = {
  PendingActivation: 'Pendiente de activación',
  Ready: 'Acceso habilitado',
  PasswordResetRequested: 'Reinicio solicitado',
};
