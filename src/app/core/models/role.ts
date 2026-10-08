/**
 * Roles que Identity emite en el claim `role` del token. `Admin` lo usa toda la plataforma; cada
 * proyecto agrega aquí los suyos, con los mismos nombres que tiene en Identity.
 */
export const Role = {
  Admin: 'Admin',
} as const;

export type Role = (typeof Role)[keyof typeof Role];
