import { Component, computed, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Role, ROLE_LABELS, UserRolesService } from '@core/index';
import { environment } from '@environments/environment';
import { AuthService } from '@features/auth/services/auth-service';
import { BrandMark } from '@shared/components/brand-mark/brand-mark';
import { ThemeToggle } from '@shared/components/theme-toggle/theme-toggle';
import { NavigationItem } from '@shared/models/navigation-item';
import { CurrentUserStore } from '@shared/services/current-user-store';

/**
 * Menú lateral: marca, opciones según el rol y la cuenta actual con el tema y el cierre de sesión.
 * Configuración y Registros retirados viven en Sheepfold; el administrador solo ve ahí catálogos y cuentas.
 */
@Component({
  imports: [
    BrandMark,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    ThemeToggle,
  ],
  selector: 'app-sidebar-component',
  host: { class: 'flex h-full flex-col bg-surface' },
  template: `
    <div class="flex items-center gap-3 px-4 pt-5 pb-6">
      <app-brand-mark [size]="44" [decorative]="true" />
      <div class="leading-tight">
        <p class="m-0 text-lg font-bold">TMT</p>
        <p class="m-0 text-sm text-secondary">{{ isManager() ? 'Administración' : 'Mi cuenta' }}</p>
      </div>
    </div>

    <nav aria-label="Menú principal" class="flex-1 overflow-y-auto px-3">
      <ul class="m-0 flex list-none flex-col gap-1 p-0">
        @for (item of visibleItems(); track item.label) {
          <li>
            @if (item.route) {
              <a
                class="tmt-nav-link"
                [routerLink]="item.route"
                routerLinkActive="is-active"
                ariaCurrentWhenActive="page"
                [routerLinkActiveOptions]="{ exact: item.route === '/' }"
                (click)="navigated.emit()"
              >
                <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon>
                <span>{{ item.label }}</span>
              </a>
            } @else {
              <a class="tmt-nav-link" [href]="item.href">
                <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon>
                <span>{{ item.label }}</span>
              </a>
            }
          </li>
        }
      </ul>
    </nav>

    <div class="flex items-center gap-2 border-t border-border-subtle px-4 py-3">
      @if (store.user.value(); as user) {
        <div class="min-w-0 flex-1">
          <p class="m-0 truncate text-sm font-medium">{{ user.firstName }} {{ user.lastName }}</p>
          <p class="tmt-meta m-0 truncate">{{ roleLabels[user.role] }}</p>
        </div>
      } @else {
        <span class="flex-1"></span>
      }
      <app-theme-toggle [compact]="true" />
      <button
        mat-icon-button
        type="button"
        aria-label="Cerrar sesión"
        matTooltip="Cerrar sesión"
        (click)="logout()"
      >
        <mat-icon>logout</mat-icon>
      </button>
    </div>
  `,
})
export class SidebarComponent {
  /** El usuario eligió una opción (en pantallas pequeñas, el layout cierra el menú). */
  public readonly navigated = output();

  protected readonly store = inject(CurrentUserStore);
  protected readonly roleLabels = ROLE_LABELS;

  private readonly _userRoles = inject(UserRolesService);
  private readonly _auth = inject(AuthService);
  private readonly _sheepfold = environment.sheepfoldUrl;
  private readonly _ministryRoles = [Role.Director, Role.Coordinator, Role.Leader, Role.Apprentice];

  private readonly _items: readonly NavigationItem[] = [
    {
      label: 'Calendario',
      icon: 'calendar_month',
      href: `${this._sheepfold}/`,
      roles: this._ministryRoles,
    },
    { label: 'Usuarios', icon: 'group', route: '/users', roles: [Role.Admin, Role.Director] },
    {
      label: 'Configuración',
      icon: 'settings',
      href: `${this._sheepfold}/settings`,
      roles: [Role.Admin, Role.Director],
    },
    {
      label: 'Registros retirados',
      icon: 'delete',
      href: `${this._sheepfold}/retired`,
      roles: [Role.Admin, Role.Director],
    },
    { label: 'Mi perfil', icon: 'person', route: '/' },
  ];

  protected readonly visibleItems = computed(() =>
    this._items.filter((item) => !item.roles || this._userRoles.hasAnyRole(item.roles)),
  );
  protected readonly isManager = computed(() =>
    this._userRoles.hasAnyRole([Role.Admin, Role.Director]),
  );

  constructor() {
    this._userRoles.ensureLoaded();
  }

  protected logout(): void {
    this._auth.logout().subscribe();
  }
}
