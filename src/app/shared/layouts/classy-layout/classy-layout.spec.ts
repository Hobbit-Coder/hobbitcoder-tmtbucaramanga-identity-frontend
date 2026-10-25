import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Role, UserRolesService } from '@core/index';
import { AuthService } from '@features/auth/services/auth-service';
import { CurrentUserStore } from '@shared/services/current-user-store';
import { of } from 'rxjs';
import { ClassyLayout } from './classy-layout';

describe('ClassyLayout', () => {
  const roles = signal<readonly string[] | null>(null);
  let fixture: ComponentFixture<ClassyLayout>;

  /** Opciones del menú lateral (escritorio). */
  async function labels(): Promise<string[]> {
    await fixture.whenStable();
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('app-sidebar-component nav a'),
    ).map((link) => link.textContent?.trim() ?? '');
  }

  beforeEach(async () => {
    roles.set(null);
    await TestBed.configureTestingModule({
      imports: [ClassyLayout],
      providers: [
        provideRouter([]),
        {
          provide: UserRolesService,
          useValue: {
            ensureLoaded: vi.fn(),
            hasAnyRole: (allowed: readonly string[]) =>
              allowed.some((role) => roles()?.includes(role)),
          },
        },
        { provide: AuthService, useValue: { logout: () => of(undefined) } },
        { provide: CurrentUserStore, useValue: { user: { value: () => undefined } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassyLayout);
  });

  it('arma el menú lateral y la barra superior alrededor del contenido', async () => {
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-sidebar-component')).not.toBeNull();
    expect(element.querySelector('header app-theme-toggle')).not.toBeNull();
    expect(element.querySelector('main router-outlet')).not.toBeNull();
  });

  it('sin roles conocidos solo muestra Mi perfil', async () => {
    expect(await labels()).toEqual([expect.stringContaining('Mi perfil')]);
  });

  it('el administrador ve Usuarios, Configuración y Registros retirados, pero no el calendario ministerial', async () => {
    roles.set([Role.Admin]);

    expect(await labels()).toEqual([
      expect.stringContaining('Usuarios'),
      expect.stringContaining('Configuración'),
      expect.stringContaining('Registros retirados'),
      expect.stringContaining('Mi perfil'),
    ]);
  });

  it('un líder ve el acceso a Sheepfold y su perfil', async () => {
    roles.set([Role.Leader]);

    expect(await labels()).toEqual([
      expect.stringContaining('Calendario'),
      expect.stringContaining('Mi perfil'),
    ]);
  });
});
