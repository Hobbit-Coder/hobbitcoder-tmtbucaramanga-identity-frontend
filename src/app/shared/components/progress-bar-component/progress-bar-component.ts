import { Component, computed, inject } from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { HttpActivityService } from '@core/index';
import { ProgressBarService } from '@shared/services/progress-bar-service';

/**
 * Barra de progreso en la parte superior. Aparece sola mientras hay peticiones HTTP en curso, o cuando
 * `ProgressBarService` la muestra.
 */
@Component({
  imports: [MatProgressBar],
  selector: 'app-progress-bar-component',
  styleUrl: './progress-bar-component.scss',
  templateUrl: './progress-bar-component.html',
})
export class ProgressBarComponent {
  public readonly progressBarService: ProgressBarService = inject(ProgressBarService);

  private readonly _httpActivity = inject(HttpActivityService);

  protected readonly isVisible = computed(
    () => this.progressBarService.progressBar().isVisible || this._httpActivity.isActive(),
  );
}
