import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { ProblemDetails } from '@core/index';
import { AuthShell } from '@features/auth/components/auth-shell/auth-shell';
import { IdentityVerification } from '@features/auth/components/identity-verification/identity-verification';
import { PasswordInput } from '@features/auth/components/password-input/password-input';
import {
  NewPassword,
  newPasswordRules,
  PASSWORD_HINT,
  passwordErrorFrom,
} from '@features/auth/models/password-rules';
import { AuthService } from '@features/auth/services/auth-service';
import { firstValueFrom } from 'rxjs';

/**
 * Recuperar acceso: el titular confirma su identidad con un código y crea una contraseña nueva.
 * Sirve también cuando la administración solicitó el reinicio. Identity cierra las sesiones abiertas.
 */
@Component({
  imports: [
    AuthShell,
    FormField,
    FormRoot,
    IdentityVerification,
    MatButtonModule,
    MatIconModule,
    PasswordInput,
    RouterLink,
  ],
  selector: 'app-recover-page',
  templateUrl: './recover-page.html',
})
export class RecoverPage {
  public readonly returnUrl = input<string>();

  protected readonly verified = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly passwordHint = PASSWORD_HINT;

  protected readonly password = signal<NewPassword>({ password: '', confirmPassword: '' });
  protected readonly passwordForm = form(this.password, newPasswordRules, {
    submission: { action: () => this.save() },
  });

  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private _verificationToken: string | null = null;

  protected onVerified(verificationToken: string): void {
    this._verificationToken = verificationToken;
    this.verified.set(true);
  }

  private async save(): Promise<void> {
    if (this._verificationToken === null) {
      this.verified.set(false);
      return;
    }

    this.errorMessage.set(null);

    try {
      await firstValueFrom(
        this._authService.resetPassword(this._verificationToken, this.password().password),
      );
      await this._router.navigate(['/auth/sign-in'], {
        queryParams: { notice: 'password', returnUrl: this.returnUrl() },
      });
    } catch (error) {
      const problem = error as ProblemDetails;

      if (
        problem.status === HttpStatusCode.BadRequest &&
        passwordErrorFrom(problem.errors) !== null
      ) {
        this.errorMessage.set(`La contraseña no cumple la política. ${PASSWORD_HINT}`);
      } else if (problem.status === HttpStatusCode.BadRequest) {
        this._verificationToken = null;
        this.verified.set(false);
        this.errorMessage.set('La verificación venció. Vuelve a confirmar tu identidad.');
      } else {
        this.errorMessage.set('No fue posible guardar la contraseña. Intenta de nuevo.');
      }
    }
  }
}
