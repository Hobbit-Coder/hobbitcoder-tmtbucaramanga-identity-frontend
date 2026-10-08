import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ProblemDetails } from '@core/index';
import { AuthService } from '@features/auth/services/auth-service';
import { of, throwError } from 'rxjs';
import { SignUpPage } from './sign-up-page';

describe('SignUpPage', () => {
  let fixture: ComponentFixture<SignUpPage>;
  let element: HTMLElement;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  const register = vi.fn();

  function fill(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  function fillValidAccount(password = 'Clave#2026'): void {
    fill('input[autocomplete=given-name]', 'Ana');
    fill('input[autocomplete=family-name]', 'Pérez');
    fill('input[type=email]', 'ana@example.com');
    fill('input[type=password]', password);
  }

  async function submit(): Promise<void> {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    register.mockReset();
    await TestBed.configureTestingModule({
      imports: [SignUpPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: { register } }],
    }).compileComponents();

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(SignUpPage);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('con una contraseña que no cumple la política no llama a Identity', async () => {
    fillValidAccount('sinsimbolo1A');

    await submit();

    expect(register).not.toHaveBeenCalled();
  });

  it('crea la cuenta sin teléfono y vuelve a la página pedida', async () => {
    register.mockReturnValue(of(undefined));
    fixture.componentRef.setInput('returnUrl', '/auth/authorize?client_id=sheepfold-web');
    fillValidAccount();

    await submit();

    expect(register).toHaveBeenCalledWith({
      firstName: 'Ana',
      lastName: 'Pérez',
      email: 'ana@example.com',
      phoneNumber: null,
      password: 'Clave#2026',
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/auth/authorize?client_id=sheepfold-web');
  });

  it('con un correo ya registrado muestra el error', async () => {
    register.mockReturnValue(throwError(() => ({ status: 409 }) as ProblemDetails));
    fillValidAccount();

    await submit();

    expect(element.querySelector('[role=alert]')?.textContent).toContain(
      'Ya existe una cuenta con ese correo.',
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
