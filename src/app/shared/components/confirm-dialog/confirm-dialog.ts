import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  icon: string;
  title: string;
  /** Persona o registro afectado, en negrita bajo el título. */
  subject?: string;
  detail?: string;
  message: string;
  confirmLabel: string;
  /** Texto del botón que no hace nada; "Cancelar" si se omite. */
  cancelLabel?: string;
  /** `danger` para acciones que retiran o eliminan. */
  tone?: 'default' | 'danger';
}

/**
 * Confirmación de una acción sensible (reinicio de contraseña, retiro, desactivación).
 * Devuelve `true` al confirmar. Cancelar es siempre la opción por defecto del foco.
 */
@Component({
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  selector: 'app-confirm-dialog',
  template: `
    <div class="relative flex flex-col items-center px-6 pt-8 pb-2 text-center">
      <button
        mat-icon-button
        mat-dialog-close
        type="button"
        class="absolute! top-2 right-2"
        aria-label="Cerrar"
      >
        <mat-icon>close</mat-icon>
      </button>
      <span
        class="flex h-14 w-14 items-center justify-center rounded-full"
        [class]="
          data.tone === 'danger'
            ? 'bg-error-container text-error'
            : 'bg-selection text-selection-text'
        "
        aria-hidden="true"
      >
        <mat-icon>{{ data.icon }}</mat-icon>
      </span>
      <h2 mat-dialog-title class="mt-4! mb-0! px-0! text-center">{{ data.title }}</h2>
      @if (data.subject) {
        <p class="m-0 font-semibold">{{ data.subject }}</p>
      }
      @if (data.detail) {
        <p class="tmt-meta m-0">{{ data.detail }}</p>
      }
      <mat-dialog-content class="px-0! pt-3!">
        <p class="m-0 text-sm text-secondary">{{ data.message }}</p>
      </mat-dialog-content>
    </div>
    <mat-dialog-actions class="grid! grid-cols-2 gap-3 border-t border-border-subtle px-6! pb-6!">
      <button mat-stroked-button type="button" mat-dialog-close cdkFocusInitial>
        {{ data.cancelLabel ?? 'Cancelar' }}
      </button>
      <button
        mat-flat-button
        type="button"
        [class.tmt-danger-button]="data.tone === 'danger'"
        [mat-dialog-close]="true"
      >
        {{ data.confirmLabel }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
