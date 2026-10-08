import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  FormRoot,
  maxLength,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ProblemDetails } from '@core/index';
import { UserData, UserResponse } from '@features/users/models';
import { UserService } from '@features/users/services/user-service';
import { firstValueFrom, Observable } from 'rxjs';

export interface UserFormDialogData {
  /** Usuario a editar; `null` para crear uno. */
  user: UserResponse | null;
  /** Roles que se pueden asignar. */
  roles: string[];
}

interface UserFormModel {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  isActive: boolean;
  emailConfirmed: boolean;
  roles: string[];
}

/**
 * Alta y edición de un usuario. Guarda por sí mismo y se cierra con `true` al terminar; si la API
 * rechaza el cambio, sigue abierto y explica por qué.
 */
@Component({
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  selector: 'app-user-form-dialog',
  styleUrl: './user-form-dialog.scss',
  templateUrl: './user-form-dialog.html',
})
export class UserFormDialog {
  /** Mismos límites que valida Identity (`UserValidationRules` y la política de contraseñas). */
  private readonly _nameMaxLength = 100;
  private readonly _emailMaxLength = 256;
  private readonly _phoneNumberMaxLength = 30;
  private readonly _passwordMinLength = 8;

  protected readonly data = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  protected readonly isCreate = this.data.user === null;
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly user = signal<UserFormModel>(this.toFormModel(this.data.user));
  protected readonly userForm = form(
    this.user,
    (path) => {
      required(path.firstName, { message: 'Escribe el nombre.' });
      maxLength(path.firstName, this._nameMaxLength, { message: 'Máximo 100 caracteres.' });
      required(path.lastName, { message: 'Escribe el apellido.' });
      maxLength(path.lastName, this._nameMaxLength, { message: 'Máximo 100 caracteres.' });
      required(path.email, { message: 'Escribe el correo.' });
      email(path.email, { message: 'Escribe un correo válido.' });
      maxLength(path.email, this._emailMaxLength, { message: 'Máximo 256 caracteres.' });
      maxLength(path.phoneNumber, this._phoneNumberMaxLength, { message: 'Máximo 30 caracteres.' });

      // La contraseña solo se pide al crear; después se cambia con "Asignar contraseña".
      if (this.isCreate) {
        required(path.password, { message: 'Escribe una contraseña.' });
        minLength(path.password, this._passwordMinLength, { message: 'Mínimo 8 caracteres.' });
        pattern(path.password, /[A-Z]/, { message: 'Incluye una letra mayúscula.' });
        pattern(path.password, /[a-z]/, { message: 'Incluye una letra minúscula.' });
        pattern(path.password, /\d/, { message: 'Incluye un número.' });
        pattern(path.password, /[^A-Za-z0-9]/, { message: 'Incluye un símbolo.' });
      }
    },
    { submission: { action: () => this.save() } },
  );

  private readonly _dialogRef = inject<MatDialogRef<UserFormDialog, boolean>>(MatDialogRef);
  private readonly _userService = inject(UserService);

  private async save(): Promise<void> {
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this.saveRequest(), { defaultValue: undefined });
      this._dialogRef.close(true);
    } catch (error) {
      this.errorMessage.set(this.toErrorMessage(error as ProblemDetails, this.isCreate));
    }
  }

  private saveRequest(): Observable<unknown> {
    const { password, ...data } = this.toUserData(this.user());

    return this.data.user === null
      ? this._userService.create({ ...data, password })
      : this._userService.update({ ...data, id: this.data.user.id });
  }

  private toFormModel(user: UserResponse | null): UserFormModel {
    return {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      password: '',
      isActive: user?.isActive ?? true,
      emailConfirmed: user?.emailConfirmed ?? false,
      roles: user?.roles ?? [],
    };
  }

  private toUserData(model: UserFormModel): UserData & { password: string } {
    const phoneNumber = model.phoneNumber.trim();

    return { ...model, phoneNumber: phoneNumber === '' ? null : phoneNumber };
  }

  private toErrorMessage(problem: ProblemDetails, isCreate: boolean): string {
    switch (problem.status) {
      case HttpStatusCode.Conflict:
        return isCreate
          ? 'Ya existe un usuario con ese correo.'
          : 'El correo ya está en uso, o el cambio te quitaría tu propio acceso de administrador.';
      case HttpStatusCode.NotFound:
        return 'El usuario ya no existe.';
      case HttpStatusCode.BadRequest:
        return 'Revisa los datos: Identity no los aceptó.';
      default:
        return 'No fue posible guardar el usuario. Intenta de nuevo.';
    }
  }
}
