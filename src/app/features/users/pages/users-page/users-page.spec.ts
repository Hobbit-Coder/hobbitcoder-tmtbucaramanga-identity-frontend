import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PagedResult, UserProfile, UserRolesService } from '@core/index';
import { UserService } from '@features/users/services/user-service';
import { CurrentUserStore } from '@shared/services/current-user-store';
import { PanelService } from '@shared/services/panel-service';
import { of } from 'rxjs';
import { UsersPage } from './users-page';

const user: UserProfile = {
  id: 'usuario-1',
  firstName: 'Ana',
  lastName: 'Pérez',
  gender: 'Female',
  phoneNumber: '+573001234567',
  email: null,
  userName: 'ana.p',
  instagram: 'ana.p',
  birthDate: '2008-03-15',
  age: 18,
  role: 'Leader',
  isActive: true,
  canRegisterAttendees: false,
  accessStatus: 'Ready',
  lockoutEnd: null,
  createdDate: '2026-10-05T00:00:00Z',
  deletedAt: null,
};

const page: PagedResult<UserProfile> = {
  items: [user],
  pageNumber: 1,
  pageSize: 20,
  totalCount: 1,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

describe('UsersPage', () => {
  const users = {
    getAll: vi.fn(() => of(page)),
    retire: vi.fn(() => of(undefined)),
    requestPasswordReset: vi.fn(() => of(undefined)),
    update: vi.fn(() => of(undefined)),
  };
  const snackBar = vi.fn();
  const dialogResult = vi.fn(() => Promise.resolve<boolean | undefined>(true));
  let isAdmin = true;
  let fixture: ComponentFixture<UsersPage>;
  let element: HTMLElement;

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [
        { provide: UserService, useValue: users },
        { provide: PanelService, useValue: { dialog: dialogResult, open: vi.fn() } },
        { provide: MatSnackBar, useValue: { open: snackBar } },
        {
          provide: UserRolesService,
          useValue: {
            ensureLoaded: vi.fn(),
            hasAnyRole: (roles: string[]) => isAdmin && roles.includes('Admin'),
          },
        },
        { provide: CurrentUserStore, useValue: { user: { value: () => undefined } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPage);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  type Actions = Record<
    'retire' | 'requestPasswordReset' | 'toggleActive',
    (target: UserProfile) => Promise<void>
  > & {
    roles(): string[];
  };

  beforeEach(() => {
    vi.clearAllMocks();
    isAdmin = true;
  });

  it('muestra la primera página de cuentas con su rol y estado', async () => {
    await setup();

    expect(users.getAll).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 20,
      search: undefined,
      isActive: undefined,
      role: undefined,
    });
    expect(element.textContent).toContain('Ana Pérez');
    expect(element.textContent).toContain('Líder');
    expect(element.textContent).toContain('Activo');
  });

  it('el director no ve ni asigna el rol Administrador', async () => {
    isAdmin = false;
    await setup();

    expect((fixture.componentInstance as unknown as Actions).roles()).not.toContain('Admin');
  });

  it('retira la cuenta después de confirmar y vuelve a consultar', async () => {
    await setup();

    await (fixture.componentInstance as unknown as Actions).retire(user);
    await fixture.whenStable();

    expect(users.retire).toHaveBeenCalledWith('usuario-1');
    expect(snackBar).toHaveBeenCalledWith('Cuenta retirada.', 'Cerrar', expect.anything());
    expect(users.getAll).toHaveBeenCalledTimes(2);
  });

  it('solicita el reinicio de contraseña sin definir una contraseña', async () => {
    await setup();

    await (fixture.componentInstance as unknown as Actions).requestPasswordReset(user);

    expect(users.requestPasswordReset).toHaveBeenCalledWith('usuario-1');
  });

  it('desactiva conservando los demás datos de la cuenta', async () => {
    await setup();

    await (fixture.componentInstance as unknown as Actions).toggleActive(user);

    expect(users.update).toHaveBeenCalledWith(
      'usuario-1',
      expect.objectContaining({ userName: 'ana.p', role: 'Leader', isActive: false }),
    );
  });

  it('sin confirmar no aplica la acción', async () => {
    dialogResult.mockReturnValueOnce(Promise.resolve(undefined));
    await setup();

    await (fixture.componentInstance as unknown as Actions).retire(user);

    expect(users.retire).not.toHaveBeenCalled();
  });
});
