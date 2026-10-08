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

  it('login, registro, refresh, logout y canje de código no llevan token', () => {
    for (const endpoint of ['login', 'register', 'refresh', 'logout', 'token']) {
      expect(audiences.forUrl(`/api/auth/${endpoint}`)).toBeNull();
    }
  });

  it('otros orígenes no llevan token', () => {
    expect(audiences.forUrl('https://fonts.googleapis.com/css2')).toBeNull();
    expect(audiences.forUrl('/assets/logo.svg')).toBeNull();
  });
});
