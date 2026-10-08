import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { SessionService } from '../services/session-service';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  const isAuthenticated = signal(false);
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));
  const navigateTo = (url: string) =>
    executeGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SessionService, useValue: { isAuthenticated } }],
    });
  });

  it('deja pasar con una sesión iniciada', () => {
    isAuthenticated.set(true);

    expect(navigateTo('/privada')).toBe(true);
  });

  it('sin sesión lleva al login y recuerda la ruta pedida', () => {
    isAuthenticated.set(false);

    const result = navigateTo('/privada');

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/auth/sign-in?returnUrl=%2Fprivada',
    );
  });

  it('sin sesión desde el inicio lleva al login sin returnUrl', () => {
    isAuthenticated.set(false);

    const result = navigateTo('/');

    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/auth/sign-in');
  });
});
