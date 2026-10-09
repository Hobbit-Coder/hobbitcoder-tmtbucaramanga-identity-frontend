import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { ProblemDetails, UserRole } from '@core/index';
import { AuthShell } from '@features/auth/components/auth-shell/auth-shell';
import { IdentityVerification } from '@features/auth/components/identity-verification/identity-verification';
import { PasswordInput } from '@features/auth/components/password-input/password-input';
import { ProfileFields } from '@features/auth/components/profile-fields/profile-fields';
import { StepProgress } from '@features/auth/components/step-progress/step-progress';
import {
  NewPassword,
  newPasswordRules,
  PASSWORD_HINT,
  passwordErrorFrom,
} from '@features/auth/models/password-rules';
import {
  emptyProfileForm,
  ProfileForm,
  profileRules,
  toProfileData,
  toProfileForm,
} from '@features/auth/models/profile-form';
import { AuthService } from '@features/auth/services/auth-service';
import { firstValueFrom } from 'rxjs';

/**
 * Primer ingreso (HU-01, M15): el titular confirma su identidad con un código, crea su contraseña y completa
 * su perfil. La cuenta queda activa solo al guardar el último paso; antes de eso no hay sesión.
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
    ProfileFields,
    RouterLink,
    StepProgress,
  ],
  selector: 'app-first-access-page',
  templateUrl: './first-access-page.html',
})
export class FirstAccessPage {
  public readonly returnUrl = input<string>();

  protected readonly steps = ['Identidad', 'Contraseña', 'Perfil'];
  protected readonly step = signal(0);
  protected readonly role = signal<UserRole | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly passwordHint = PASSWORD_HINT;

  protected readonly password = signal<NewPassword>({ password: '', confirmPassword: '' });
  protected readonly passwordForm = form(this.password, newPasswordRules, {
    submission: { action: async () => this.step.set(2) },
  });

  protected readonly profile = signal<ProfileForm>(emptyProfileForm());
  protected readonly profileForm = form(
    this.profile,
    (path) => profileRules(path, () => new Date()),
    {
      submission: { action: () => this.activate() },
    },
  );

  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private _verificationToken: string | null = null;

  /** Con la identidad confirmada se cargan los datos que la administración ya registró. */
  protected async onVerified(verificationToken: string): Promise<void> {
    this._verificationToken = verificationToken;
    this.errorMessage.set(null);

    try {
      const account = await firstValueFrom(
        this._authService.getActivationProfile(verificationToken),
      );

      this.profile.set(toProfileForm(account));
      this.role.set(account.role);
      this.step.set(1);
    } catch {
      this.errorMessage.set('La verificación venció. Vuelve a pedir el código.');
    }
  }

  protected back(): void {
    this.errorMessage.set(null);
    this.step.update((step) => Math.max(0, step - 1));
  }

  private async activate(): Promise<void> {
    if (this._verificationToken === null) {
      this.step.set(0);
      return;
    }

    this.errorMessage.set(null);

    try {
      await firstValueFrom(
        this._authService.activate(
          this._verificationToken,
          this.password().password,
          toProfileData(this.profile()),
        ),
      );
      await this._router.navigate(['/auth/sign-in'], {
        queryParams: { notice: 'activated', returnUrl: this.returnUrl() },
      });
    } catch (error) {
      this.errorMessage.set(this.toMessage(error as ProblemDetails));
    }
  }

  private toMessage(problem: ProblemDetails): string {
    if (problem.status === HttpStatusCode.BadRequest) {
      if (passwordErrorFrom(problem.errors) !== null) {
        this.step.set(1);
        return `La contraseña no cumple la política. ${PASSWORD_HINT}`;
      }

      const fields = Object.keys(problem.errors ?? {}).map((name) => name.toLowerCase());

      if (fields.some((name) => name.includes('verification'))) {
        this.step.set(0);
        return 'La verificación venció. Vuelve a confirmar tu identidad.';
      }

      if (fields.length > 0) {
        return 'Revisa los datos: el teléfono, el usuario o el correo podrían estar en uso por otra cuenta.';
      }
    }

    return problem.status === 0
      ? 'No fue posible conectar con el servidor. Intenta de nuevo.'
      : 'No fue posible activar la cuenta. Intenta de nuevo.';
  }
}
