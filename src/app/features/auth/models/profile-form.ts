import {
  email,
  maxLength,
  pattern,
  required,
  SchemaPathTree,
  validate,
} from '@angular/forms/signals';
import { dayFromPicker, Gender, pickerDate, ProfileData, UserProfile } from '@core/index';

/**
 * Perfil editable tal como lo maneja el formulario: textos vacíos en lugar de null para que los campos
 * los editen y la fecha como `Date` del selector de Material. `toProfileData` lo vuelve a la forma que espera Identity.
 */
export interface ProfileForm {
  firstName: string;
  lastName: string;
  gender: Gender | '';
  phoneNumber: string;
  email: string;
  userName: string;
  instagram: string;
  birthDate: Date | null;
}

export function emptyProfileForm(): ProfileForm {
  return {
    firstName: '',
    lastName: '',
    gender: '',
    phoneNumber: '',
    email: '',
    userName: '',
    instagram: '',
    birthDate: null,
  };
}

export function toProfileForm(profile: UserProfile): ProfileForm {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    gender: profile.gender ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    email: profile.email ?? '',
    userName: profile.userName,
    instagram: profile.instagram ?? '',
    birthDate: pickerDate(profile.birthDate),
  };
}

export function toProfileData(profile: ProfileForm): ProfileData {
  const optional = (value: string) => (value.trim() === '' ? null : value.trim());

  return {
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    gender: profile.gender === '' ? null : profile.gender,
    phoneNumber: profile.phoneNumber.trim(),
    email: optional(profile.email),
    userName: profile.userName.trim(),
    instagram: optional(profile.instagram),
    birthDate: optional(dayFromPicker(profile.birthDate)),
  };
}

/** Edad en años cumplidos a la fecha local, o null sin fecha de nacimiento (la calcula también Identity). */
export function ageOn(birthDate: string, today: Date): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);

  if (match === null) {
    return null;
  }

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const hadBirthday =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  const age = today.getFullYear() - year - (hadBirthday ? 0 : 1);

  return age >= 0 ? age : null;
}

/**
 * Reglas del perfil: todo es obligatorio menos el correo. Son las mismas de Identity: usuario de 3 a
 * 50 caracteres con al menos una letra y sin `@`, teléfono de 8 a 15 dígitos (10 dígitos se toman como de Colombia) y nacimiento no futuro.
 */
export function profileRules(path: SchemaPathTree<ProfileForm>, today: () => Date): void {
  required(path.firstName, { message: 'Escribe tus nombres.' });
  maxLength(path.firstName, 100, { message: 'Máximo 100 caracteres.' });
  required(path.lastName, { message: 'Escribe tus apellidos.' });
  maxLength(path.lastName, 100, { message: 'Máximo 100 caracteres.' });
  required(path.gender, { message: 'Selecciona el género.' });
  required(path.phoneNumber, { message: 'Escribe tu número de teléfono.' });
  validate(path.phoneNumber, ({ value }) => {
    const text = value().trim();
    const digits = text.replace(/\D/g, '');

    return text === '' || (digits.length >= 8 && digits.length <= 15 && /^[\d\s().+-]+$/.test(text))
      ? null
      : { kind: 'phone', message: 'Escribe un teléfono válido.' };
  });
  email(path.email, { message: 'Escribe un correo válido.' });
  maxLength(path.email, 256, { message: 'Máximo 256 caracteres.' });
  required(path.userName, { message: 'Escribe un nombre de usuario.' });
  pattern(path.userName, /^[A-Za-z0-9._-]{3,50}$/, {
    message: 'De 3 a 50 letras, números, punto, guion o guion bajo.',
  });
  validate(path.userName, ({ value }) =>
    value() === '' || /[A-Za-z]/.test(value())
      ? null
      : { kind: 'letter', message: 'Debe incluir al menos una letra.' },
  );
  required(path.instagram, { message: 'Escribe tu usuario de Instagram.' });
  maxLength(path.instagram, 60, { message: 'Máximo 60 caracteres.' });
  required(path.birthDate, { message: 'Escribe tu fecha de nacimiento.' });
  validate(path.birthDate, ({ value }) =>
    value() !== null && ageOn(dayFromPicker(value()), today()) === null
      ? { kind: 'future', message: 'La fecha no puede ser futura.' }
      : null,
  );
}
