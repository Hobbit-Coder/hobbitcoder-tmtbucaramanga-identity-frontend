import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { ProblemDetails, RegisterRequest, SignInUrlService } from '@core/index';
import { AuthService } from '@features/auth/services/auth-service';
import { firstValueFrom } from 'rxjs';

/** Campos del formulario; el teléfono es opcional y se envía como `null` si queda vacío. */
interface SignUpModel {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

/** Registro público en Identity: crea la cuenta, inicia sesión y vuelve a `returnUrl`. */
@Component({
  imports: [FormField, FormRoot, MatButtonModule, MatFormFieldModule, MatInputModule, RouterLink],
  selector: 'app-sign-up-page',
  styleUrl: './sign-up-page.scss',
  templateUrl: './sign-up-page.html',
})
export class SignUpPage {
  /** Mismos límites que valida Identity (`UserValidationRules` y la política de contraseñas). */
  private readonly _nameMaxLength = 100;
  private readonly _emailMaxLength = 256;
  private readonly _phoneNumberMaxLength = 30;
  private readonly _passwordMinLength = 8;

  /** Página a la que se vuelve después de crear la cuenta (query param `returnUrl`). */
  public readonly returnUrl = input<string>();

  protected readonly account = signal<SignUpModel>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly signUpForm = form(
    this.account,
    (path) => {
      required(path.firstName, { message: 'Ingresa tu nombre.' });
      maxLength(path.firstName, this._nameMaxLength, { message: 'Máximo 100 caracteres.' });
      required(path.lastName, { message: 'Ingresa tu apellido.' });
      maxLength(path.lastName, this._nameMaxLength, { message: 'Máximo 100 caracteres.' });
      required(path.email, { message: 'Ingresa tu correo.' });
      email(path.email, { message: 'Ingresa un correo válido.' });
      maxLength(path.email, this._emailMaxLength, { message: 'Máximo 256 caracteres.' });
      maxLength(path.phoneNumber, this._phoneNumberMaxLength, { message: 'Máximo 30 caracteres.' });
      required(path.password, { message: 'Crea una contraseña.' });
      minLength(path.password, this._passwordMinLength, { message: 'Mínimo 8 caracteres.' });
      pattern(path.password, /[A-Z]/, { message: 'Incluye una letra mayúscula.' });
      pattern(path.password, /[a-z]/, { message: 'Incluye una letra minúscula.' });
      pattern(path.password, /\d/, { message: 'Incluye un número.' });
      pattern(path.password, /[^A-Za-z0-9]/, { message: 'Incluye un símbolo.' });
    },
    { submission: { action: () => this.signUp() } },
  );

  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _signInUrl = inject(SignInUrlService);

  private async signUp(): Promise<void> {
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this._authService.register(this.toRegisterRequest(this.account())));
      await this._router.navigateByUrl(this._signInUrl.safeReturnUrl(this.returnUrl()));
    } catch (error) {
      this.errorMessage.set(this.toSignUpErrorMessage(error as ProblemDetails));
    }
  }

  private toRegisterRequest(account: SignUpModel): RegisterRequest {
    const phoneNumber = account.phoneNumber.trim();

    return { ...account, phoneNumber: phoneNumber === '' ? null : phoneNumber };
  }

  private toSignUpErrorMessage(problem: ProblemDetails): string {
    switch (problem.status) {
      case HttpStatusCode.Conflict:
        return 'Ya existe una cuenta con ese correo.';
      case HttpStatusCode.BadRequest:
        return 'Revisa los datos: Identity no los aceptó.';
      case 0:
        return 'No fue posible conectar con el servidor. Intenta de nuevo.';
      default:
        return 'No fue posible crear la cuenta. Intenta de nuevo.';
    }
  }
}
