import { Component, inject } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { LoaderService } from '@shared/services/loader-service';

/** Bloquea la pantalla mientras `LoaderService` lo indique (operaciones que el usuario debe esperar). */
@Component({
  imports: [MatProgressSpinner],
  selector: 'app-loader-component',
  styleUrl: './loader-component.scss',
  templateUrl: './loader-component.html',
})
export class LoaderComponent {
  public readonly loaderService: LoaderService = inject(LoaderService);
}
