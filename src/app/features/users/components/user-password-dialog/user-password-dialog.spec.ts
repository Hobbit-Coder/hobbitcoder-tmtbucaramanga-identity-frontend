import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '@features/users/services/user-service';
import { of } from 'rxjs';
import { UserPasswordDialog } from './user-password-dialog';

describe('UserPasswordDialog', () => {
  const setPassword = vi.fn(() => of(undefined));
  const close = vi.fn();
  let fixture: ComponentFixture<UserPasswordDialog>;
  let element: HTMLElement;

  async function submitPassword(value: string): Promise<void> {
    const input = element.querySelector<HTMLInputElement>('input')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [UserPasswordDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { id: 'usuario-1', firstName: 'Ana', lastName: 'Pérez' },
        },
        { provide: MatDialogRef, useValue: { close } },
        { provide: UserService, useValue: { setPassword } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserPasswordDialog);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('asigna la contraseña y cierra el diálogo', async () => {
    await submitPassword('Nueva#2026');

    expect(setPassword).toHaveBeenCalledWith({ id: 'usuario-1', newPassword: 'Nueva#2026' });
    expect(close).toHaveBeenCalledWith(true);
  });

  it('no envía una contraseña que no cumple la política', async () => {
    await submitPassword('sinsimbolo1A');

    expect(setPassword).not.toHaveBeenCalled();
  });
});
