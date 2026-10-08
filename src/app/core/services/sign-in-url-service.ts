import { inject, Service } from '@angular/core';
import { Router, UrlTree } from '@angular/router';

/** Rutas hacia el login y de vuelta a la página a la que se quería ir. */
@Service()
export class SignInUrlService {
  private readonly _router = inject(Router);
  private readonly _signInPath = '/auth/sign-in';
  private readonly _homePath = '/';

  /** Lleva al login y recuerda en `returnUrl` a dónde volver, salvo que sea el inicio. */
  public signInUrlTree(returnUrl: string = this._homePath): UrlTree {
    const queryParams = returnUrl !== this._homePath ? { returnUrl } : {};

    return this._router.createUrlTree([this._signInPath], { queryParams });
  }

  /**
   * `returnUrl` solo admite rutas internas de la aplicación. Cualquier otro valor (otro dominio,
   * `//dominio` o `/\dominio`, que el navegador trata como externos) lleva al inicio.
   */
  public safeReturnUrl(returnUrl: string | null | undefined): string {
    const isInternal = !!returnUrl && /^\/(?![/\\])/.test(returnUrl);

    return isInternal ? returnUrl : this._homePath;
  }
}
