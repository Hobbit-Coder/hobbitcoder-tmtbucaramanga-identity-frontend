import { TestBed } from '@angular/core/testing';
import { JwtService } from './jwt-service';

/** Token sin firma real: solo importa el payload. */
function token(payload: object): string {
  return `encabezado.${btoa(JSON.stringify(payload))}.firma`;
}

describe('JwtService', () => {
  let jwt: JwtService;

  beforeEach(() => {
    jwt = TestBed.inject(JwtService);
  });

  it('lee varios roles', () => {
    expect(jwt.readRoles(token({ role: ['Admin', 'Editor'] }))).toEqual(['Admin', 'Editor']);
  });

  it('lee un único rol', () => {
    expect(jwt.readRoles(token({ role: 'Admin' }))).toEqual(['Admin']);
  });

  it('sin claim role no hay roles', () => {
    expect(jwt.readRoles(token({ sub: '1' }))).toEqual([]);
  });

  it('un token ilegible no tiene roles', () => {
    expect(jwt.readRoles('no-es-un-jwt')).toEqual([]);
  });
});
