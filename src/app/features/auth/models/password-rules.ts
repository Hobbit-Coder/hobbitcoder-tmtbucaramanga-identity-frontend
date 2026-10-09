import { SchemaPath, SchemaPathTree, validate } from '@angular/forms/signals';

/**
 * Política de contraseñas de Identity (ASP.NET Core Identity): 8 caracteres o más con mayúscula, minúscula,
 * número y símbolo. Se valida aquí para guiar al titular; Identity la vuelve a aplicar.
 */
export const PASSWORD_HINT = 'Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.';

export function passwordProblem(password: string): string | null {
  if (password.length === 0) {
    return 'Escribe una contraseña.';
  }

  const meetsPolicy =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  return meetsPolicy ? null : PASSWORD_HINT;
}

export interface NewPassword {
  password: string;
  confirmPassword: string;
}

/** Contraseña nueva con confirmación (primer ingreso, recuperación y cambio de contraseña). */
export function newPasswordRules(path: SchemaPathTree<NewPassword>): void {
  passwordPairRules(path.password, path.confirmPassword);
}

/** Política y coincidencia para un par contraseña/confirmación dentro de cualquier modelo. */
export function passwordPairRules(
  password: SchemaPath<string>,
  confirmPassword: SchemaPath<string>,
): void {
  validate(password, ({ value }) => {
    const message = passwordProblem(value());

    return message === null ? null : { kind: 'password', message };
  });
  validate(confirmPassword, ({ value, valueOf }) =>
    value() === valueOf(password)
      ? null
      : { kind: 'mismatch', message: 'Las contraseñas no coinciden.' },
  );
}

/** Errores de Identity en el campo de la contraseña (400 con `errors.Password`). */
export function passwordErrorFrom(errors: Record<string, string[]> | undefined): string | null {
  const key = Object.keys(errors ?? {}).find((name) => name.toLowerCase().includes('password'));

  return key === undefined ? null : PASSWORD_HINT;
}
