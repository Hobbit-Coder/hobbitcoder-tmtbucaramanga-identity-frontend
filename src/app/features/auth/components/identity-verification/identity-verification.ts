import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, FormRoot, readonly, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ProblemDetails, VerificationPurpose } from '@core/index';
import { AuthService } from '@features/auth/services/auth-service';
import { firstValueFrom } from 'rxjs';

interface VerificationModel {
  identifier: string;
  code: string;
}

/**
 * Confirmación de identidad del titular (§6): teléfono o usuario y el código recibido por WhatsApp (único
 * canal habilitado: el proveedor es WhatsApp Cloud API y no envía SMS).
 * Antes de pedir el código muestra "Enviar código"; después, el identificador en lectura y "Confirmar
 * identidad". El código es un solo campo que admite pegar; su longitud y vigencia las define Identity.
 */
@Component({
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  selector: 'app-identity-verification',
  template: `
    <form class="flex flex-col gap-4" [formRoot]="verificationForm">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Teléfono o nombre de usuario</mat-label>
        <mat-icon matPrefix class="mx-2 text-secondary">person</mat-icon>
        <input matInput autocomplete="username" [formField]="verificationForm.identifier" />
        <mat-error>{{ verificationForm.identifier().errors()[0]?.message }}</mat-error>
      </mat-form-field>

      @if (!codeSent()) {
        <p class="tmt-meta m-0 flex items-center gap-2">
          <mat-icon aria-hidden="true">chat</mat-icon> Te enviaremos un código de seguridad por
          WhatsApp a tu teléfono registrado.
        </p>
      }

      @if (codeSent()) {
        <p class="tmt-alert m-0" role="status">
          <mat-icon class="text-info">info</mat-icon>
          <span
            >Si los datos corresponden a una cuenta
            {{ purpose() === 'Activation' ? 'pendiente de activar' : 'activa' }}, enviamos un código
            de seguridad por WhatsApp a su teléfono registrado.</span
          >
        </p>

        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Código de confirmación</mat-label>
          <mat-icon matPrefix class="mx-2 text-secondary">lock</mat-icon>
          <input
            matInput
            inputmode="numeric"
            autocomplete="one-time-code"
            placeholder="Ingresa el código"
            [formField]="verificationForm.code"
          />
          <mat-error>{{ verificationForm.code().errors()[0]?.message }}</mat-error>
        </mat-form-field>
      }

      @if (errorMessage(); as message) {
        <p class="tmt-alert is-error m-0" role="alert">
          <mat-icon class="text-error">error</mat-icon><span>{{ message }}</span>
        </p>
      }

      <button mat-flat-button type="submit" class="h-12!" [disabled]="busy()">
        {{ codeSent() ? 'Confirmar identidad' : 'Enviar código' }}
        <mat-icon iconPositionEnd>arrow_forward</mat-icon>
      </button>

      @if (codeSent()) {
        <button mat-button type="button" (click)="restart()">Usar otro teléfono o usuario</button>
      }

      <p class="tmt-meta m-0 flex items-center gap-1">
        <mat-icon class="text-base!">shield</mat-icon> No compartas tu código de seguridad. Nunca te
        pediremos tu contraseña por mensaje.
      </p>
    </form>
  `,
})
export class IdentityVerification {
  /** Proceso de seguridad: primer ingreso o recuperación del acceso. */
  public readonly purpose = input.required<VerificationPurpose>();

  /** Identidad confirmada: emite el token de verificación. */
  public readonly verified = output<string>();

  protected readonly model = signal<VerificationModel>({
    identifier: '',
    code: '',
  });
  protected readonly codeSent = signal(false);
  protected readonly busy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly verificationForm = form(
    this.model,
    (path) => {
      required(path.identifier, { message: 'Escribe tu teléfono o tu nombre de usuario.' });
      readonly(path.identifier, () => this.codeSent());
      required(path.code, {
        message: 'Escribe el código que recibiste.',
        when: () => this.codeSent(),
      });
    },
    { submission: { action: () => this.submit() } },
  );

  private readonly _authService = inject(AuthService);
  private _verificationId: string | null = null;

  protected restart(): void {
    this.codeSent.set(false);
    this._verificationId = null;
    this.errorMessage.set(null);
    this.model.update((model) => ({ ...model, code: '' }));
  }

  private async submit(): Promise<void> {
    this.errorMessage.set(null);
    this.busy.set(true);

    try {
      const { identifier, code } = this.model();

      if (!this.codeSent() || this._verificationId === null) {
        this._verificationId = await firstValueFrom(
          this._authService.startVerification(identifier.trim(), 'WhatsApp', this.purpose()),
        );
        this.codeSent.set(true);
        // El campo del código aparece limpio: el envío anterior no debe marcarlo como error.
        this.verificationForm.code().reset();
        return;
      }

      this.verified.emit(
        await firstValueFrom(
          this._authService.confirmVerification(this._verificationId, code.trim()),
        ),
      );
    } catch (error) {
      this.errorMessage.set(this.toMessage(error as ProblemDetails));
    } finally {
      this.busy.set(false);
    }
  }

  private toMessage(problem: ProblemDetails): string {
    switch (problem.status) {
      case HttpStatusCode.BadRequest:
        return this.codeSent()
          ? 'El código no es válido o ya venció. Revísalo o pide uno nuevo.'
          : 'Revisa el teléfono o el nombre de usuario.';
      case HttpStatusCode.ServiceUnavailable:
        return 'No fue posible enviar el código por WhatsApp en este momento. Intenta más tarde.';
      case 0:
        return 'No fue posible conectar con el servidor. Intenta de nuevo.';
      default:
        return 'No fue posible confirmar tu identidad. Intenta de nuevo.';
    }
  }
}
