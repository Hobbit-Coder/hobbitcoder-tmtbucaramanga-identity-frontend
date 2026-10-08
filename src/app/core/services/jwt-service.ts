import { Service } from '@angular/core';

interface AccessTokenPayload {
  role?: string | string[];
}

/** Lectura de los tokens de acceso que emite Identity. */
@Service()
export class JwtService {
  /**
   * Roles del claim `role` de un token de acceso (Identity emite uno o varios). No verifica la firma:
   * sirve para decidir qué mostrar, nunca para autorizar; cada API valida el token. Un token ilegible
   * no tiene roles.
   */
  public readRoles(accessToken: string): string[] {
    try {
      const { role } = JSON.parse(
        this.decodeBase64Url(accessToken.split('.')[1]),
      ) as AccessTokenPayload;

      if (role === undefined) {
        return [];
      }

      return Array.isArray(role) ? role : [role];
    } catch {
      return [];
    }
  }

  private decodeBase64Url(value: string): string {
    const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));

    return new TextDecoder().decode(bytes);
  }
}
