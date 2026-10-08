import { ThemePalette } from '@angular/material/core';
import { ProgressBarMode } from '@angular/material/progress-bar';

export interface ProgressBar {
  isVisible: boolean;
  color: ThemePalette;
  mode: ProgressBarMode;
}
