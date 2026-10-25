import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemePreference, ThemeService } from '@core/services/theme-service';

const OPTIONS: readonly { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'system', label: 'Sistema', icon: 'brightness_auto' },
  { value: 'light', label: 'Claro', icon: 'light_mode' },
  { value: 'dark', label: 'Oscuro', icon: 'dark_mode' },
];

/**
 * Tema: Sistema, Claro u Oscuro. `compact` es el botón de la barra con un menú; el modo completo es el selector
 * del contenedor de acceso. El ícono y el nombre muestran la preferencia actual.
 */
@Component({
  imports: [MatButtonModule, MatButtonToggleModule, MatIconModule, MatMenuModule, MatTooltipModule],
  selector: 'app-theme-toggle',
  template: `
    @if (compact()) {
      <button
        mat-icon-button
        type="button"
        [matMenuTriggerFor]="themeMenu"
        [attr.aria-label]="'Tema: ' + current().label"
        [matTooltip]="'Tema: ' + current().label"
      >
        <mat-icon>{{ current().icon }}</mat-icon>
      </button>
      <mat-menu #themeMenu="matMenu">
        @for (option of options; track option.value) {
          <button
            mat-menu-item
            type="button"
            role="menuitemradio"
            [attr.aria-checked]="option.value === theme.preference()"
            (click)="theme.set(option.value)"
          >
            <mat-icon>{{ option.icon }}</mat-icon>
            <span>{{ option.label }}</span>
            @if (option.value === theme.preference()) {
              <mat-icon class="ml-4! mr-0!" aria-hidden="true">check</mat-icon>
            }
          </button>
        }
      </mat-menu>
    } @else {
      <mat-button-toggle-group
        hideSingleSelectionIndicator
        aria-label="Tema de la interfaz"
        [value]="theme.preference()"
        (change)="theme.set($event.value)"
      >
        @for (option of options; track option.value) {
          <mat-button-toggle [value]="option.value" [attr.aria-label]="'Tema ' + option.label"
            ><mat-icon>{{ option.icon }}</mat-icon></mat-button-toggle
          >
        }
      </mat-button-toggle-group>
    }
  `,
})
export class ThemeToggle {
  public readonly compact = input(false);

  protected readonly theme = inject(ThemeService);
  protected readonly options = OPTIONS;
  protected readonly current = computed(
    () => OPTIONS.find((option) => option.value === this.theme.preference()) ?? OPTIONS[0],
  );
}
