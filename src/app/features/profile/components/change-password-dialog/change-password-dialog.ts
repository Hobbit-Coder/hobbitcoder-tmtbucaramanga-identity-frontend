import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ProblemDetails } from '@core/index';
import { PasswordInput } from '@features/auth/components/password-input/password-input';
import {
  NewPassword,
  PASSWORD_HINT,
  passwordPairRules,
} from '@features/auth/models/password-rules';
import { AuthService } from '@features/auth/services/auth-service';
import { firstValueFrom } from 'rxjs';

interface ChangePasswordModel extends NewPassword {
  currentPassword: string;
}

/**
 * Cambio de la contraseña propia (Mi perfil). Identity cierra todas las sesiones al guardarla, así que se
 * cierra con `true` para que Mi perfil lleve al ingreso.
 */
@Component({
  imports: [FormField, FormRoot, MatButtonModule, MatDialogModule, MatIconModule, PasswordInput],
  selector: 'app-change-password-dialog',
  template: `
    <form [formRoot]="passwordForm">
      <h2 mat-dialog-title>Cambiar contraseña</h2>
      <mat-dialog-content class="flex flex-col gap-4">
        <p class="m-0 text-sm text-secondary">
          Al guardarla se cierran tus sesiones, también en Sheepfold, y vuelves a ingresar.
        </p>
        <app-password-input label="Contraseña actual" [formField]="passwordForm.currentPassword" />
        <app-password-input
          label="Contraseña nueva"
          autocomplete="new-password"
          [hint]="passwordHint"
          [formField]="passwordForm.password"
        />
        <app-password-input
          label="Confirmar contraseña"
          placeholder="Vuelve a ingresar tu contraseña"
          autocomplete="new-password"
          [formField]="passwordForm.confirmPassword"
        />
        @if (errorMessage(); as message) {
          <p class="tmt-alert is-error m-0" role="alert">
            <mat-icon class="text-error">error</mat-icon><span>{{ message }}</span>
          </p>
        }
      </mat-dialog-content>
      <mat-dialog-actions class="grid! grid-cols-2 gap-3">
        <button mat-stroked-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="passwordForm().submitting()">
          Guardar
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class ChangePasswordDialog {
  protected readonly passwordHint = PASSWORD_HINT;
  protected readonly model = signal<ChangePasswordModel>({
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });
  protected readonly passwordForm = form(
    this.model,
    (path) => {
      required(path.currentPassword, { message: 'Escribe tu contraseña actual.' });
      passwordPairRules(path.password, path.confirmPassword);
    },
    { submission: { action: () => this.save() } },
  );
  protected readonly errorMessage = signal<string | null>(null);

  private readonly _auth = inject(AuthService);
  private readonly _dialogRef = inject(MatDialogRef<ChangePasswordDialog, boolean>);

  private async save(): Promise<void> {
    this.errorMessage.set(null);

    try {
      const { currentPassword, password } = this.model();

      await firstValueFrom(this._auth.changePassword(currentPassword, password), {
        defaultValue: undefined,
      });
      this._dialogRef.close(true);
    } catch (error) {
      this.errorMessage.set(this.toMessage(error as ProblemDetails));
    }
  }

  /** Identity responde 400 con `CurrentPassword` (actual incorrecta) o `NewPassword` (política). */
  private toMessage(problem: ProblemDetails): string {
    if (problem.status !== HttpStatusCode.BadRequest) {
      return 'No fue posible cambiar la contraseña. Intenta de nuevo.';
    }

    return Object.keys(problem.errors ?? {}).some((key) => key.toLowerCase() === 'currentpassword')
      ? 'La contraseña actual no es correcta.'
      : `La contraseña nueva no cumple la política. ${PASSWORD_HINT}`;
  }
}
