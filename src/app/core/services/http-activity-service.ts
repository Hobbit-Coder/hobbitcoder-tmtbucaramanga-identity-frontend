import { computed, Service, signal } from '@angular/core';

/** Peticiones HTTP en curso. `httpActivityInterceptor` las cuenta; la barra de progreso las muestra. */
@Service()
export class HttpActivityService {
  private readonly _pendingRequests = signal(0);

  public readonly isActive = computed(() => this._pendingRequests() > 0);

  public started(): void {
    this._pendingRequests.update((pending) => pending + 1);
  }

  public finished(): void {
    this._pendingRequests.update((pending) => Math.max(0, pending - 1));
  }
}
