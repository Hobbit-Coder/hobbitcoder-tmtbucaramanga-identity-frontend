import { Component, computed, inject, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Role, UserRolesService } from '@core/index';
import { NavigationItem } from '@shared/models/navigation-item';

/** Menú lateral con las opciones que el usuario puede ver según sus roles. */
@Component({
  imports: [MatIconModule, MatListModule, RouterLink, RouterLinkActive],
  selector: 'app-sidebar-component',
  styleUrl: './sidebar-component.scss',
  templateUrl: './sidebar-component.html',
})
export class SidebarComponent {
  /** El usuario eligió una opción (en pantallas pequeñas, el layout cierra el menú). */
  public readonly navigated = output();

  private readonly _userRoles = inject(UserRolesService);

  /** Opciones del menú. Para limitar una a ciertos roles, agrega `roles: [Role.Admin]`. */
  private readonly _items: readonly NavigationItem[] = [
    { label: 'Mi cuenta', icon: 'person', route: '/' },
    { label: 'Usuarios', icon: 'group', route: '/users', roles: [Role.Admin] },
  ];

  protected readonly visibleItems = computed(() =>
    this._items.filter((item) => !item.roles || this._userRoles.hasAnyRole(item.roles)),
  );

  constructor() {
    this._userRoles.ensureLoaded();
  }
}
