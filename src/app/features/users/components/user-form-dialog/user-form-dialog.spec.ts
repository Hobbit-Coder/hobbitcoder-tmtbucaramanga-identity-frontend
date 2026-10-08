import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProblemDetails } from '@core/index';
import { UserResponse } from '@features/users/models';
import { UserService } from '@features/users/services/user-service';
import { of, throwError } from 'rxjs';
import { UserFormDialog, UserFormDialogData } from './user-form-dialog';

const user: UserResponse = {
  id: 'usuario-1',
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Pérez',
  phoneNumber: null,
  isActive: true,
  emailConfirmed: false,
  lockoutEnd: null,
  createdDate: '2026-10-05T00:00:00Z',
  roles: ['Admin'],
};

describe('UserFormDialog', () => {
  const create = vi.fn();
  const update = vi.fn();
  const close = vi.fn();
  let fixture: ComponentFixture<UserFormDialog>;
  let element: HTMLElement;

  async function render(data: UserFormDialogData): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [UserFormDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close } },
        { provide: UserService, useValue: { create, update } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormDialog);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  function fill(label: string, value: string): void {
    const input = Array.from(element.querySelectorAll('mat-form-field'))
      .find((field) => field.textContent?.includes(label))!
      .querySelector('input')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function submit(): Promise<void> {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(() => vi.clearAllMocks());

  it('crea el usuario con la contraseña y cierra el diálogo', async () => {
    create.mockReturnValue(of('usuario-2'));
    await render({ user: null, roles: ['Admin'] });
    fill('Nombre', 'Luis');
    fill('Apellido', 'Gómez');
    fill('Correo', 'luis@example.com');
    fill('Contraseña', 'Clave#2026');

    await submit();

    expect(create).toHaveBeenCalledWith({
      firstName: 'Luis',
      lastName: 'Gómez',
      email: 'luis@example.com',
      phoneNumber: null,
      password: 'Clave#2026',
      isActive: true,
      emailConfirmed: false,
      roles: [],
    });
    expect(close).toHaveBeenCalledWith(true);
  });

  it('sin contraseña válida no crea el usuario', async () => {
    await render({ user: null, roles: [] });
    fill('Nombre', 'Luis');
    fill('Apellido', 'Gómez');
    fill('Correo', 'luis@example.com');
    fill('Contraseña', 'corta');

    await submit();

    expect(create).not.toHaveBeenCalled();
  });

  it('al editar no pide contraseña y conserva los datos', async () => {
    update.mockReturnValue(of(undefined));
    await render({ user, roles: ['Admin'] });

    expect(element.textContent).not.toContain('Contraseña');
    await submit();

    expect(update).toHaveBeenCalledWith({
      id: 'usuario-1',
      firstName: 'Ana',
      lastName: 'Pérez',
      email: 'ana@example.com',
      phoneNumber: null,
      isActive: true,
      emailConfirmed: false,
      roles: ['Admin'],
    });
  });

  it('si el correo ya existe sigue abierto y lo explica', async () => {
    create.mockReturnValue(throwError(() => ({ status: 409 }) as ProblemDetails));
    await render({ user: null, roles: [] });
    fill('Nombre', 'Luis');
    fill('Apellido', 'Gómez');
    fill('Correo', 'luis@example.com');
    fill('Contraseña', 'Clave#2026');

    await submit();

    expect(close).not.toHaveBeenCalled();
    expect(element.querySelector('[role=alert]')?.textContent).toContain(
      'Ya existe un usuario con ese correo.',
    );
  });
});
