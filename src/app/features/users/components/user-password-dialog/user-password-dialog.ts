import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, minLength, pattern, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserResponse } from '@features/users/models';
import { UserService } from '@features/users/services/user-service';
import { firstValueFrom } from 'rxjs';

/**
 * Asigna una contraseña nueva a un usuario sin conocer la actual. Identity además desbloquea la
 * cuenta y cierra todas sus sesiones. Se cierra con `true` al terminar.
 */
@Component({
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  selector: 'app-user-password-dialog',
  styleUrl: './user-password-dialog.scss',
  templateUrl: './user-password-dialog.html',
})
export class UserPasswordDialog {
  /** Misma política de contraseñas que aplica Identity. */
  private readonly _passwordMinLength = 8;

  protected readonly user = inject<UserResponse>(MAT_DIALOG_DATA);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly password = signal({ newPassword: '' });
  protected readonly passwordForm = form(
    this.password,
    (path) => {
      required(path.newPassword, { message: 'Escribe una contraseña.' });
      minLength(path.newPassword, this._passwordMinLength, { message: 'Mínimo 8 caracteres.' });
      pattern(path.newPassword, /[A-Z]/, { message: 'Incluye una letra mayúscula.' });
      pattern(path.newPassword, /[a-z]/, { message: 'Incluye una letra minúscula.' });
      pattern(path.newPassword, /\d/, { message: 'Incluye un número.' });
      pattern(path.newPassword, /[^A-Za-z0-9]/, { message: 'Incluye un símbolo.' });
    },
    { submission: { action: () => this.save() } },
  );

  private readonly _dialogRef = inject<MatDialogRef<UserPasswordDialog, boolean>>(MatDialogRef);
  private readonly _userService = inject(UserService);

  private async save(): Promise<void> {
    this.errorMessage.set(null);

    try {
      await firstValueFrom(
        this._userService.setPassword({
          id: this.user.id,
          newPassword: this.password().newPassword,
        }),
        { defaultValue: undefined },
      );
      this._dialogRef.close(true);
    } catch {
      this.errorMessage.set('Identity no aceptó la contraseña. Revisa que cumpla la política.');
    }
  }
}
