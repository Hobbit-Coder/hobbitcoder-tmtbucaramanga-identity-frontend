import {
  email,
  maxLength,
  pattern,
  required,
  SchemaPathTree,
  validate,
} from '@angular/forms/signals';
import { dayFromPicker, UserProfile, UserRole } from '@core/index';
import {
  ageOn,
  emptyProfileForm,
  ProfileForm,
  toProfileData,
  toProfileForm,
} from '@features/auth/models/profile-form';
import { UserData } from './user';

/** Editor de cuentas: el perfil más los datos que solo define la administración. */
export interface UserForm {
  profile: ProfileForm;
  role: UserRole | '';
  isActive: boolean;
  canRegisterAttendees: boolean;
}

export function toUserForm(user: UserProfile | null): UserForm {
  return user === null
    ? { profile: emptyProfileForm(), role: '', isActive: true, canRegisterAttendees: false }
    : {
        profile: toProfileForm(user),
        role: user.role,
        isActive: user.isActive,
        canRegisterAttendees: user.canRegisterAttendees,
      };
}

export function toUserData(form: UserForm): UserData {
  return {
    ...toProfileData(form.profile),
    role: form.role as UserRole,
    isActive: form.isActive,
    canRegisterAttendees: form.canRegisterAttendees,
  };
}

/**
 * Reglas de Identity al registrar o editar una cuenta: nombres, teléfono, usuario y rol son
 * obligatorios; género, Instagram y nacimiento los completa el titular al activar su cuenta.
 */
export function userRules(path: SchemaPathTree<UserForm>, today: () => Date): void {
  const profile = path.profile;

  required(profile.firstName, { message: 'Escribe el nombre.' });
  maxLength(profile.firstName, 100, { message: 'Máximo 100 caracteres.' });
  required(profile.lastName, { message: 'Escribe el apellido.' });
  maxLength(profile.lastName, 100, { message: 'Máximo 100 caracteres.' });
  required(profile.phoneNumber, {
    message: 'Escribe el teléfono: allí llegan los códigos de seguridad.',
  });
  validate(profile.phoneNumber, ({ value }) => {
    const text = value().trim();
    const digits = text.replace(/\D/g, '');

    return text === '' || (digits.length >= 8 && digits.length <= 15 && /^[\d\s().+-]+$/.test(text))
      ? null
      : { kind: 'phone', message: 'Escribe un teléfono válido.' };
  });
  email(profile.email, { message: 'Escribe un correo válido.' });
  required(profile.userName, { message: 'Escribe el nombre de usuario.' });
  pattern(profile.userName, /^[A-Za-z0-9._-]{3,50}$/, {
    message: 'De 3 a 50 letras, números, punto, guion o guion bajo.',
  });
  validate(profile.userName, ({ value }) =>
    value() === '' || /[A-Za-z]/.test(value())
      ? null
      : { kind: 'letter', message: 'Debe incluir al menos una letra.' },
  );
  maxLength(profile.instagram, 60, { message: 'Máximo 60 caracteres.' });
  validate(profile.birthDate, ({ value }) =>
    value() !== null && ageOn(dayFromPicker(value()), today()) === null
      ? { kind: 'future', message: 'La fecha no puede ser futura.' }
      : null,
  );
  required(path.role, { message: 'Selecciona el rol.' });
}
