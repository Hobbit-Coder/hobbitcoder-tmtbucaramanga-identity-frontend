import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PagedResult } from '@core/index';
import { UserResponse } from '@features/users/models';
import { UserService } from '@features/users/services/user-service';
import { of } from 'rxjs';
import { UsersPage } from './users-page';

const user: UserResponse = {
  id: 'usuario-1',
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Pérez',
  phoneNumber: null,
  isActive: true,
  emailConfirmed: true,
  lockoutEnd: null,
  createdDate: '2026-10-05T00:00:00Z',
  roles: ['Admin'],
};

const page: PagedResult<UserResponse> = {
  items: [user],
  pageNumber: 1,
  pageSize: 20,
  totalCount: 1,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

describe('UsersPage', () => {
  const users = { getAll: vi.fn(() => of(page)), delete: vi.fn(() => of(undefined)) };
  const open = vi.fn();
  let fixture: ComponentFixture<UsersPage>;
  let element: HTMLElement;

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [
        { provide: UserService, useValue: users },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: MatSnackBar, useValue: { open } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPage);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('muestra la primera página de usuarios', () => {
    expect(users.getAll).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20 });
    expect(element.textContent).toContain('Ana Pérez');
    expect(element.textContent).toContain('ana@example.com');
  });

  it('busca con los filtros desde la primera página', async () => {
    const input = element.querySelector<HTMLInputElement>('form input')!;
    input.value = '  ana ';
    input.dispatchEvent(new Event('input'));

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(users.getAll).toHaveBeenLastCalledWith({
      pageNumber: 1,
      pageSize: 20,
      search: 'ana',
      isActive: undefined,
      role: undefined,
    });
  });

  it('elimina y vuelve a consultar', async () => {
    const component = fixture.componentInstance as unknown as {
      delete(user: UserResponse): Promise<void>;
    };

    await component.delete(user);
    await fixture.whenStable();

    expect(users.delete).toHaveBeenCalledWith('usuario-1');
    expect(open).toHaveBeenCalledWith('Usuario eliminado.', 'Cerrar', expect.anything());
    expect(users.getAll).toHaveBeenCalledTimes(2);
  });
});
