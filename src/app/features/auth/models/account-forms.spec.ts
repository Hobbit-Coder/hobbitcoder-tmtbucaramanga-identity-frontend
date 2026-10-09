import { passwordProblem } from './password-rules';
import { ageOn, toProfileData } from './profile-form';

describe('Reglas de los formularios de cuenta', () => {
  it('la contraseña sigue la política de Identity', () => {
    expect(passwordProblem('')).toBe('Escribe una contraseña.');
    expect(passwordProblem('corta#1A')).toBeNull();
    expect(passwordProblem('sinmayuscula#1')).not.toBeNull();
    expect(passwordProblem('SINMINUSCULA#1')).not.toBeNull();
    expect(passwordProblem('SinNumero#')).not.toBeNull();
    expect(passwordProblem('SinSimbolo1')).not.toBeNull();
  });

  it('la edad cuenta los años cumplidos a la fecha local', () => {
    const today = new Date(2026, 9, 8);

    expect(ageOn('2008-10-08', today)).toBe(18);
    expect(ageOn('2008-10-09', today)).toBe(17);
    expect(ageOn('2026-10-09', today)).toBeNull();
    expect(ageOn('', today)).toBeNull();
  });

  it('el perfil se envía sin espacios y con los opcionales vacíos como null', () => {
    expect(
      toProfileData({
        firstName: ' Ana ',
        lastName: 'Pérez',
        gender: 'Female',
        phoneNumber: ' 3001234567 ',
        email: ' ',
        userName: 'ana.p',
        instagram: 'ana.p',
        birthDate: '2008-03-15',
      }),
    ).toEqual({
      firstName: 'Ana',
      lastName: 'Pérez',
      gender: 'Female',
      phoneNumber: '3001234567',
      email: null,
      userName: 'ana.p',
      instagram: 'ana.p',
      birthDate: '2008-03-15',
    });
  });
});
