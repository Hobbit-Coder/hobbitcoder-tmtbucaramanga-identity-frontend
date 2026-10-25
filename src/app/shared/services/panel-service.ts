import { hasModifierKey } from '@angular/cdk/keycodes';
import { ComponentType } from '@angular/cdk/portal';
import { inject, Service } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialog, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog';
import { filter, firstValueFrom, merge } from 'rxjs';

/**
 * Panel que entrega un resultado aunque se cierre con Escape o fuera del panel (por ejemplo, si cambió algo
 * y la página que lo abrió debe recargar).
 */
export interface PanelWithResult<TResult> {
  panelResult(): TResult;
}

/** Panel o diálogo con un formulario: si tiene cambios sin guardar, cerrar con Escape o fuera pide confirmación. */
export interface PanelWithUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

const DISCARD_CHANGES: ConfirmDialogData = {
  icon: 'edit_off',
  title: '¿Descartar los cambios?',
  message: 'Lo que escribiste en este formulario no se ha guardado.',
  confirmLabel: 'Descartar',
  cancelLabel: 'Seguir editando',
  tone: 'danger',
};

/**
 * Paneles de detalle y edición: a la derecha y a todo el alto en escritorio (560 px detalle,
 * 720 px editor), a pantalla completa en móvil. Escape y el botón cerrar los cierran; el foco vuelve al
 * elemento que los abrió.
 */
@Service()
export class PanelService {
  private readonly _dialog = inject(MatDialog);

  public open<TComponent, TData, TResult>(
    component: ComponentType<TComponent>,
    data: TData,
    width: 480 | 560 | 640 | 720 = 560,
  ): Promise<TResult | undefined> {
    return this.openGuarded<TComponent, TData, TResult>(component, {
      data,
      width: `${width}px`,
      maxWidth: '100vw',
      height: '100%',
      maxHeight: '100dvh',
      position: { right: '0', top: '0' },
      panelClass: 'tmt-side-panel',
      autoFocus: 'first-heading',
      // El deslizamiento está en `.tmt-side-panel`; salir es más rápido que entrar.
      enterAnimationDuration: 240,
      exitAnimationDuration: 180,
    });
  }

  /** Diálogo centrado y corto (confirmaciones, traslados, pendientes). */
  public dialog<TComponent, TData, TResult>(
    component: ComponentType<TComponent>,
    data: TData,
    width = 520,
  ): Promise<TResult | undefined> {
    return this.openGuarded<TComponent, TData, TResult>(component, {
      data,
      width: `${width}px`,
      maxWidth: 'calc(100vw - 2rem)',
      autoFocus: 'first-tabbable',
    });
  }

  /**
   * Escape y el clic fuera se atienden aquí: entregan el resultado del panel (ver PanelWithResult) y, si hay
   * cambios sin guardar (ver PanelWithUnsavedChanges), preguntan antes de cerrar.
   */
  private openGuarded<TComponent, TData, TResult>(
    component: ComponentType<TComponent>,
    config: MatDialogConfig<TData>,
  ): Promise<TResult | undefined> {
    const ref = this._dialog.open<TComponent, TData, TResult>(component, {
      ...config,
      restoreFocus: true,
      disableClose: true,
    });

    merge(
      ref.backdropClick(),
      ref.keydownEvents().pipe(filter((event) => event.key === 'Escape' && !hasModifierKey(event))),
    ).subscribe((event) => {
      event.preventDefault();
      void this.close(ref);
    });

    return firstValueFrom(ref.afterClosed());
  }

  private async close<TComponent, TResult>(ref: MatDialogRef<TComponent, TResult>): Promise<void> {
    const panel = ref.componentInstance as Partial<
      PanelWithResult<TResult> & PanelWithUnsavedChanges
    >;

    if (panel.hasUnsavedChanges?.() && !(await this.confirmDiscard())) {
      return;
    }

    ref.close(panel.panelResult?.());
  }

  private confirmDiscard(): Promise<boolean | undefined> {
    return firstValueFrom(
      this._dialog
        .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
          data: DISCARD_CHANGES,
          width: '440px',
          maxWidth: 'calc(100vw - 2rem)',
          restoreFocus: true,
        })
        .afterClosed(),
    );
  }
}
