import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '@core/services/theme-service';

/**
 * Cambio de tema. `compact` es el botón de la barra superior (alterna claro/oscuro); el modo completo es el
 * selector Claro/Oscuro del contenedor de acceso.
 */
@Component({
  imports: [MatButtonModule, MatButtonToggleModule, MatIconModule, MatTooltipModule],
  selector: 'app-theme-toggle',
  template: `
    @if (compact()) {
      <button
        mat-icon-button
        type="button"
        [attr.aria-label]="theme.isDark() ? 'Usar tema claro' : 'Usar tema oscuro'"
        [matTooltip]="theme.isDark() ? 'Tema claro' : 'Tema oscuro'"
        (click)="theme.toggle()"
      >
        <mat-icon>{{ theme.isDark() ? 'dark_mode' : 'light_mode' }}</mat-icon>
      </button>
    } @else {
      <mat-button-toggle-group
        hideSingleSelectionIndicator
        aria-label="Tema de la interfaz"
        [value]="theme.isDark() ? 'dark' : 'light'"
        (change)="theme.set($event.value)"
      >
        <mat-button-toggle value="light" aria-label="Tema claro"
          ><mat-icon>light_mode</mat-icon></mat-button-toggle
        >
        <mat-button-toggle value="dark" aria-label="Tema oscuro"
          ><mat-icon>dark_mode</mat-icon></mat-button-toggle
        >
      </mat-button-toggle-group>
    }
  `,
})
export class ThemeToggle {
  public readonly compact = input(false);

  protected readonly theme = inject(ThemeService);
}
