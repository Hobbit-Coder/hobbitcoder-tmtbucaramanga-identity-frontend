import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';

/**
 * Navegación del navegador a otra aplicación (otro origen), que el router de Angular no puede hacer.
 * Se usa en el inicio de sesión entre Identity y sus aplicaciones cliente.
 */
@Service()
export class ExternalNavigationService {
  private readonly _document = inject(DOCUMENT);

  public navigateTo(url: string): void {
    this._document.location.assign(url);
  }
}
