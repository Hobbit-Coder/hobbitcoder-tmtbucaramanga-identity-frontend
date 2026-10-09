import { TestBed } from '@angular/core/testing';
import { environment } from '@environments/environment';
import { AudienceService } from './audience-service';

describe('AudienceService', () => {
  let audiences: AudienceService;

  beforeEach(() => {
    audiences = TestBed.inject(AudienceService);
  });

  it('los endpoints protegidos de Identity usan su audiencia', () => {
    expect(audiences.forUrl('/api/auth/me')).toBe(environment.audiences.identity);
    expect(audiences.forUrl('/api/auth/authorize')).toBe(environment.audiences.identity);
    expect(audiences.forUrl('/api/users?pageNumber=1')).toBe(environment.audiences.identity);
  });

  it('login, refresh, logout, canje de código y procesos sin sesión no llevan token', () => {
    for (const endpoint of [
      'auth/login',
      'auth/refresh',
      'auth/logout',
      'auth/token',
      'account/verification',
      'account/verification/confirm',
      'account/activation',
      'account/activation/profile',
      'account/password',
    ]) {
      expect(audiences.forUrl(`/api/${endpoint}`)).toBeNull();
    }
  });

  it('la API de Sheepfold lleva un token con su audiencia', () => {
    expect(audiences.forUrl(`${environment.sheepfoldApiUrl}/api/users/1/responsibilities`)).toBe(
      environment.audiences.sheepfold,
    );
  });

  it('otros orígenes no llevan token', () => {
    expect(audiences.forUrl('https://fonts.googleapis.com/css2')).toBeNull();
    expect(audiences.forUrl('/assets/logo.svg')).toBeNull();
  });
});
