import {
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';

/** Campo de contraseña con candado y botón para mostrarla u ocultarla. Se usa con `[formField]`. */
@Component({
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  selector: 'app-password-input',
  host: { class: 'block' },
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
      <mat-label>{{ label() }}</mat-label>
      <mat-icon matPrefix class="mx-2 text-secondary">lock</mat-icon>
      <input
        matInput
        [type]="visible() ? 'text' : 'password'"
        [attr.autocomplete]="autocomplete()"
        [placeholder]="placeholder()"
        [value]="value()"
        [disabled]="disabled()"
        [errorStateMatcher]="errorState"
        (input)="value.set($any($event.target).value)"
        (blur)="touch.emit()"
      />
      <button
        mat-icon-button
        matSuffix
        type="button"
        class="mr-1"
        [attr.aria-label]="visible() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        [attr.aria-pressed]="visible()"
        (click)="visible.set(!visible())"
      >
        <mat-icon>{{ visible() ? 'visibility_off' : 'visibility' }}</mat-icon>
      </button>
      @if (hint(); as text) {
        <mat-hint>{{ text }}</mat-hint>
      }
      <mat-error>{{ errors()[0]?.message }}</mat-error>
    </mat-form-field>
  `,
})
export class PasswordInput implements FormValueControl<string> {
  public readonly value = model('');
  public readonly touched = input(false);
  public readonly disabled = input(false);
  public readonly invalid = input(false);
  public readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  public readonly touch = output<void>();

  public readonly label = input('Contraseña');
  public readonly placeholder = input('Ingresa tu contraseña');
  public readonly autocomplete = input<'current-password' | 'new-password'>('current-password');
  public readonly hint = input<string | null>(null);

  protected readonly visible = signal(false);

  /** El error se muestra cuando el campo ya se tocó (o se intentó enviar), como en los demás campos. */
  private readonly _showError = computed(() => this.touched() && this.invalid());

  protected readonly errorState: ErrorStateMatcher = {
    isErrorState: () => this._showError(),
  };

  private readonly _input = viewChild.required(MatInput);

  /**
   * Material recalcula el error solo en su ngDoCheck; la plantilla no lee `touched` ni `invalid`, así que al
   * tocar el campo o enviar el formulario no habría una nueva verificación. Se avisa explícitamente.
   */
  constructor() {
    effect(() => {
      this._showError();
      this._input().updateErrorState();
    });
  }
}
