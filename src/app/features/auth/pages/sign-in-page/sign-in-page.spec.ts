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

  it('inicia sesión y vuelve a la página pedida', async () => {
    login.mockReturnValue(of(undefined));
    fixture.componentRef.setInput('returnUrl', '/auth/authorize?client_id=sheepfold-web');
    fill('input[type=email]', 'ana@example.com');
    fill('input[type=password]', 'Clave#2026');

    await submit();

    expect(login).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'Clave#2026' });
    expect(navigateByUrl).toHaveBeenCalledWith('/auth/authorize?client_id=sheepfold-web');
  });

  it('ignora un returnUrl externo', async () => {
    login.mockReturnValue(of(undefined));
    fixture.componentRef.setInput('returnUrl', 'https://evil.com');
    fill('input[type=email]', 'ana@example.com');
    fill('input[type=password]', 'Clave#2026');

    await submit();

    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('con credenciales inválidas muestra el error', async () => {
    const problem = { status: 401 } as ProblemDetails;
    login.mockReturnValue(throwError(() => problem));
    fill('input[type=email]', 'ana@example.com');
    fill('input[type=password]', 'mala');

    await submit();

    expect(element.querySelector('[role=alert]')?.textContent).toContain(
      'El correo o la contraseña no son válidos.',
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
