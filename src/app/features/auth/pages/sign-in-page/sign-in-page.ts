import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { LoginCredentials, ProblemDetails, SignInUrlService } from '@core/index';
import { AuthShell } from '@features/auth/components/auth-shell/auth-shell';
import { PasswordInput } from '@features/auth/components/password-input/password-input';
import { AuthService } from '@features/auth/services/auth-service';
import { firstValueFrom } from 'rxjs';

/**
 * Ingreso con teléfono, nombre de usuario o correo registrado. Al entrar vuelve a `returnUrl`
 * (por ejemplo, a autorizar a Sheepfold). Desde aquí se llega al primer ingreso y a la recuperación.
 */
@Component({
  imports: [
    AuthShell,
    FormField,
    FormRoot,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    PasswordInput,
    RouterLink,
  ],
  selector: 'app-sign-in-page',
  templateUrl: './sign-in-page.html',
})
export class SignInPage {
  /** Página a la que se vuelve después de iniciar sesión (query param `returnUrl`). */
  public readonly returnUrl = input<string>();

  /** Aviso al volver de activar la cuenta o de crear una contraseña nueva (query param `notice`). */
  public readonly notice = input<string>();

  protected readonly credentials = signal<LoginCredentials>({ identifier: '', password: '' });
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly signInForm = form(
    this.credentials,
    (path) => {
      required(path.identifier, { message: 'Escribe tu teléfono, usuario o correo.' });
      required(path.password, { message: 'Escribe tu contraseña.' });
    },
    { submission: { action: () => this.signIn() } },
  );

  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _signInUrl = inject(SignInUrlService);

  private async signIn(): Promise<void> {
    this.errorMessage.set(null);

    try {
      const { identifier, password } = this.credentials();

      await firstValueFrom(this._authService.login({ identifier: identifier.trim(), password }));
      await this._router.navigateByUrl(this._signInUrl.safeReturnUrl(this.returnUrl()));
    } catch (error) {
      this.errorMessage.set(this.toSignInErrorMessage(error as ProblemDetails));
    }
  }

  /**
   * Identity responde 401 sin distinguir el motivo (credenciales, pendiente de activar o bloqueada), para no
   * revelar qué cuentas existen. Solo con la contraseña correcta de una cuenta desactivada responde 403.
   */
  private toSignInErrorMessage(problem: ProblemDetails): string {
    switch (problem.status) {
      case HttpStatusCode.Unauthorized:
        return 'Los datos de ingreso no son válidos. Si es tu primer ingreso, activa tu cuenta.';
      case HttpStatusCode.Forbidden:
        return 'Tu acceso no está disponible. Comunícate con la administración del ministerio.';
      case HttpStatusCode.TooManyRequests:
        return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.';
      case 0:
        return 'No fue posible conectar con el servidor. Intenta de nuevo.';
      default:
        return 'No fue posible ingresar. Intenta de nuevo.';
    }
  }
}
