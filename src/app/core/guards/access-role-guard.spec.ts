import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  GuardResult,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, isObservable, Observable, of, throwError } from 'rxjs';
import { Role } from '../models/role';
import { SessionService } from '../services/session-service';
import { UserRolesService } from '../services/user-roles-service';
import { accessRoleGuard, requireRoles } from './access-role-guard';

describe('accessRoleGuard', () => {
  const isAuthenticated = signal(true);
  const hasAnyRoleAsync = vi.fn<(roles: readonly string[]) => Observable<boolean>>();
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => accessRoleGuard(...guardParameters));

  /** Navega a una ruta configurada con `requireRoles` y resuelve el resultado del guard. */
  async function navigate(roles: readonly string[]): Promise<GuardResult> {
    const route = { data: requireRoles(roles).data } as unknown as ActivatedRouteSnapshot;
    const result = executeGuard(route, { url: '/privada' } as RouterStateSnapshot);

    return isObservable(result) ? firstValueFrom(result) : result;
  }

  const serialize = (result: GuardResult) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  beforeEach(() => {
    isAuthenticated.set(true);
    hasAnyRoleAsync.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: { isAuthenticated } },
        { provide: UserRolesService, useValue: { hasAnyRoleAsync } },
      ],
    });
  });

  it('deja entrar con alguno de los roles de la ruta', async () => {
    hasAnyRoleAsync.mockReturnValue(of(true));

    await expect(navigate([Role.Admin])).resolves.toBe(true);
    expect(hasAnyRoleAsync).toHaveBeenCalledWith([Role.Admin]);
  });

  it('sin los roles lleva a acceso denegado', async () => {
    hasAnyRoleAsync.mockReturnValue(of(false));

    expect(serialize(await navigate([Role.Admin]))).toBe('/error/unauthorized');
  });

  it('sin sesión lleva al login recordando la ruta', async () => {
    isAuthenticated.set(false);

    expect(serialize(await navigate([Role.Admin]))).toBe('/auth/sign-in?returnUrl=%2Fprivada');
    expect(hasAnyRoleAsync).not.toHaveBeenCalled();
  });

  it('si no se pueden conocer los roles no deja entrar', async () => {
    hasAnyRoleAsync.mockReturnValue(throwError(() => new Error('sesión vencida')));

    await expect(navigate([Role.Admin])).resolves.toBe(false);
  });
});

describe('requireRoles', () => {
  it('configura el guard y los roles de la ruta', () => {
    expect(requireRoles([Role.Admin])).toEqual({
      canActivate: [accessRoleGuard],
      data: { roles: [Role.Admin] },
    });
  });
});
