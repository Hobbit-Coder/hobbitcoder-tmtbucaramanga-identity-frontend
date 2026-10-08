import {
  computed,
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { UserRolesService } from '@core/index';

/**
 * Crea el contenido solo si el usuario tiene alguno de los roles, y lo quita si los pierde. Admite una
 * plantilla alternativa:
 *
 * ```html
 * <button *appAccessRole="[role.Admin]; else readOnly">Crear usuario</button>
 * ```
 *
 * Solo decide qué se muestra: la API valida los roles en cada petición.
 */
@Directive({
  selector: '[appAccessRole]',
})
export class AccessRoleDirective {
  public readonly appAccessRole = input.required<readonly string[]>();
  public readonly appAccessRoleElse = input<TemplateRef<unknown> | null>(null);

  private readonly _templateRef = inject(TemplateRef);
  private readonly _viewContainer = inject(ViewContainerRef);
  private readonly _userRoles = inject(UserRolesService);
  private readonly _isAllowed = computed(() => this._userRoles.hasAnyRole(this.appAccessRole()));

  constructor() {
    this._userRoles.ensureLoaded();
    effect(() => this.render(this._isAllowed() ? this._templateRef : this.appAccessRoleElse()));
  }

  private render(template: TemplateRef<unknown> | null): void {
    this._viewContainer.clear();

    if (template !== null) {
      this._viewContainer.createEmbeddedView(template);
    }
  }
}
