import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ProblemDetails } from '@core/index';
import { AuthService } from '@features/auth/services/auth-service';
import { of, throwError } from 'rxjs';
import { SignInPage } from './sign-in-page';

describe('SignInPage', () => {
  let fixture: ComponentFixture<SignInPage>;
  let element: HTMLElement;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;
  const login = vi.fn();

  function fill(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  async function submit(): Promise<void> {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    login.mockReset();
    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: { login } }],
    }).compileComponents();

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(SignInPage);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('con el formulario incompleto no llama a Identity', async () => {
    await submit();

    expect(login).not.toHaveBeenCalled();
  });

  it('ingresa con teléfono, usuario o correo y vuelve a la página pedida', async () => {
    login.mockReturnValue(of(undefined));
    fixture.componentRef.setInput('returnUrl', '/auth/authorize?client_id=sheepfold-web');
    fill('input[autocomplete=username]', ' 300 123 4567 ');
    fill('input[autocomplete=current-password]', 'Clave#2026');

    await submit();

    expect(login).toHaveBeenCalledWith({ identifier: '300 123 4567', password: 'Clave#2026' });
    expect(navigateByUrl).toHaveBeenCalledWith('/auth/authorize?client_id=sheepfold-web');
  });

  it('ignora un returnUrl externo', async () => {
    login.mockReturnValue(of(undefined));
    fixture.componentRef.setInput('returnUrl', 'https://evil.com');
    fill('input[autocomplete=username]', 'ana.p');
    fill('input[autocomplete=current-password]', 'Clave#2026');

    await submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('con datos inválidos muestra un error que no revela si la cuenta existe', async () => {
    login.mockReturnValue(throwError(() => ({ status: 401 }) as ProblemDetails));
    fill('input[autocomplete=username]', 'ana.p');
    fill('input[autocomplete=current-password]', 'mala');

    await submit();

    expect(element.querySelector('[role=alert]')?.textContent).toContain(
      'Los datos de ingreso no son válidos.',
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('con una cuenta desactivada informa que el acceso no está disponible', async () => {
    login.mockReturnValue(throwError(() => ({ status: 403 }) as ProblemDetails));
    fill('input[autocomplete=username]', 'ana.p');
    fill('input[autocomplete=current-password]', 'Clave#123');

    await submit();

    expect(element.querySelector('[role=alert]')?.textContent).toContain(
      'Tu acceso no está disponible.',
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('ofrece el primer ingreso y la recuperación del acceso', () => {
    const links = [...element.querySelectorAll('nav a')].map((link) => link.getAttribute('href'));

    expect(links.some((href) => href?.startsWith('/auth/first-access'))).toBe(true);
    expect(links.some((href) => href?.startsWith('/auth/recover'))).toBe(true);
  });
});
