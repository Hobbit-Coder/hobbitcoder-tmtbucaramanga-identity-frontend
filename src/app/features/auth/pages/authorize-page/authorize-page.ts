import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { AuthorizeRequest, ExternalNavigationService, ProblemDetails } from '@core/index';
import { AuthService } from '@features/auth/services/auth-service';

/**
 * Punto de entrada de las aplicaciones cliente (OAuth 2.0 con PKCE). Sheepfold envía aquí al usuario
 * con `client_id`, `redirect_uri`, `code_challenge`, `code_challenge_method` y `state`. Con la sesión
 * de Identity ya iniciada (`authGuard`), pide el código y devuelve el navegador al cliente.
 *
 * Identity valida el cliente y su URI de retorno antes de emitir el código: si no son válidos, esta
 * página muestra el error y nunca redirige.
 */
@Component({
  imports: [RouterLink],
  selector: 'app-authorize-page',
  styleUrl: './authorize-page.scss',
  templateUrl: './authorize-page.html',
})
export class AuthorizePage implements OnInit {
  protected readonly errorMessage = signal<string | null>(null);

  private readonly _authService = inject(AuthService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _externalNavigation = inject(ExternalNavigationService);

  public ngOnInit(): void {
    this._authService
      .authorize(this.toAuthorizeRequest(this._route.snapshot.queryParamMap))
      .subscribe({
        next: (redirectUri) => this._externalNavigation.navigateTo(redirectUri),
        error: (problem: ProblemDetails) =>
          this.errorMessage.set(this.toAuthorizeErrorMessage(problem)),
      });
  }

  /** Los parámetros llegan con los nombres de OAuth 2.0; uno ausente lo rechaza Identity (400). */
  private toAuthorizeRequest(query: ParamMap): AuthorizeRequest {
    return {
      clientId: query.get('client_id') ?? '',
      redirectUri: query.get('redirect_uri') ?? '',
      codeChallenge: query.get('code_challenge') ?? '',
      codeChallengeMethod: query.get('code_challenge_method') ?? '',
      state: query.get('state') ?? '',
    };
  }

  private toAuthorizeErrorMessage(problem: ProblemDetails): string {
    return problem.status === HttpStatusCode.BadRequest
      ? 'La aplicación que te trajo aquí no está registrada en Identity o envió una solicitud inválida.'
      : 'No fue posible volver a la aplicación. Intenta de nuevo.';
  }
}
