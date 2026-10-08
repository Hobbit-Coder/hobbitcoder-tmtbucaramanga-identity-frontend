import { Service, signal } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { ProgressBarMode } from '@angular/material/progress-bar';
import { ProgressBar } from '@shared/models/progress-bar';

@Service()
export class ProgressBarService {
  public readonly progressBar = signal<ProgressBar>({
    isVisible: false,
    color: 'primary',
    mode: 'indeterminate',
  });

  public show(color?: ThemePalette, mode?: ProgressBarMode): void {
    this.progressBar.update((current) => ({
      ...current,
      isVisible: true,
      color: color ?? current.color,
      mode: mode ?? current.mode,
    }));
  }

  public hide(): void {
    this.progressBar.update((current) => ({
      ...current,
      isVisible: false,
    }));
  }
}
