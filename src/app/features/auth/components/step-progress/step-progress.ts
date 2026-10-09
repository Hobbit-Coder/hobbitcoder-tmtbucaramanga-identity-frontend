import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Progreso de un proceso por pasos (Identidad → Contraseña → Perfil). El paso actual se anuncia. */
@Component({
  imports: [MatIconModule],
  selector: 'app-step-progress',
  template: `
    <ol class="m-0 flex list-none items-start gap-2 p-0" aria-label="Pasos">
      @for (step of steps(); track step; let index = $index; let last = $last) {
        <li
          class="flex flex-1 flex-col items-center gap-1 text-center"
          [attr.aria-current]="index === current() ? 'step' : null"
        >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold"
            [class]="
              index < current()
                ? 'border-accent bg-accent text-on-accent'
                : index === current()
                  ? 'border-accent bg-accent text-on-accent'
                  : 'border-outline-control text-secondary'
            "
          >
            @if (index < current()) {
              <mat-icon class="h-5! w-5! text-xl!">check</mat-icon>
            } @else {
              {{ index + 1 }}
            }
          </span>
          <span
            class="text-xs"
            [class]="index === current() ? 'font-semibold text-accent' : 'text-secondary'"
            >{{ step }}</span
          >
          @if (index < current()) {
            <span class="tmt-visually-hidden">completado</span>
          }
        </li>
        @if (!last) {
          <li aria-hidden="true" class="mt-4 h-px flex-1 bg-border-subtle"></li>
        }
      }
    </ol>
  `,
})
export class StepProgress {
  public readonly steps = input.required<string[]>();
  public readonly current = input.required<number>();
}
