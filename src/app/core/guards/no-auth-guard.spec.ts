import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  convertToParamMap,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { SessionService } from '../services/session-service';
import { noAuthGuard } from './no-auth-guard';

describe('noAuthGuard', () => {
  const isAuthenticated = signal(false);
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => noAuthGuard(...guardParameters));
  const navigate = (queryParams: Record<string, string> = {}) =>
    executeGuard(
      { queryParamMap: convertToParamMap(queryParams) } as ActivatedRouteSnapshot,
      { url: '/auth/sign-in' } as RouterStateSnapshot,
    );
  const serialize = (result: ReturnType<typeof navigate>) =>
    TestBed.inject(Router).serializeUrl(result as UrlTree);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SessionService, useValue: { isAuthenticated } }],
    });
  });

  it('sin sesión muestra el login', () => {
    isAuthenticated.set(false);

    expect(navigate()).toBe(true);
  });

  it('con una sesión iniciada lleva al inicio', () => {
    isAuthenticated.set(true);

    const result = navigate();

    expect(result).toBeInstanceOf(UrlTree);
    expect(serialize(result)).toBe('/');
  });

  it('con una sesión iniciada sigue a la página pedida', () => {
    isAuthenticated.set(true);

    expect(serialize(navigate({ returnUrl: '/auth/authorize?client_id=sheepfold-web' }))).toBe(
      '/auth/authorize?client_id=sheepfold-web',
    );
  });

  it('ignora un returnUrl externo', () => {
    isAuthenticated.set(true);

    expect(serialize(navigate({ returnUrl: '//evil.com' }))).toBe('/');
  });
});
