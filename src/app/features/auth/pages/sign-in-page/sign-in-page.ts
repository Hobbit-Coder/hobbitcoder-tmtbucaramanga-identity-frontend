import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { LoginCredentials, ProblemDetails, SignInUrlService } from '@core/index';
import { AuthService } from '@features/auth/services/auth-service';
import { firstValueFrom } from 'rxjs';

/** Inicio de sesión en Identity. Al entrar vuelve a `returnUrl` (por ejemplo, a autorizar a Sheepfold). */
@Component({
  imports: [FormField, FormRoot, MatButtonModule, MatFormFieldModule, MatInputModule, RouterLink],
  selector: 'app-sign-in-page',
  styleUrl: './sign-in-page.scss',
  templateUrl: './sign-in-page.html',
})
export class SignInPage {
  /** Página a la que se vuelve después de iniciar sesión (query param `returnUrl`). */
  public readonly returnUrl = input<string>();

  protected readonly credentials = signal<LoginCredentials>({ email: '', password: '' });
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly signInForm = form(
    this.credentials,
    (path) => {
      required(path.email, { message: 'Ingresa tu correo.' });
      email(path.email, { message: 'Ingresa un correo válido.' });
      required(path.password, { message: 'Ingresa tu contraseña.' });
    },
    { submission: { action: () => this.signIn() } },
  );

  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _signInUrl = inject(SignInUrlService);

  private async signIn(): Promise<void> {
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this._authService.login(this.credentials()));
      await this._router.navigateByUrl(this._signInUrl.safeReturnUrl(this.returnUrl()));
    } catch (error) {
      this.errorMessage.set(this.toSignInErrorMessage(error as ProblemDetails));
    }
  }

  /** Identity responde 401 sin distinguir el motivo (credenciales, cuenta inactiva o bloqueada). */
  private toSignInErrorMessage(problem: ProblemDetails): string {
    switch (problem.status) {
      case HttpStatusCode.Unauthorized:
        return 'El correo o la contraseña no son válidos.';
      case 0:
        return 'No fue posible conectar con el servidor. Intenta de nuevo.';
      default:
        return 'No fue posible iniciar sesión. Intenta de nuevo.';
    }
  }
}
