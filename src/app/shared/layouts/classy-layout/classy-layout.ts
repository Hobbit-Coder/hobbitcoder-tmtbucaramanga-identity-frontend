import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Role, ROLE_LABELS, UserRolesService } from '@core/index';
import { environment } from '@environments/environment';
import { AuthService } from '@features/auth/services/auth-service';
import { BrandMark } from '@shared/components/brand-mark/brand-mark';
import { SidebarComponent } from '@shared/components/sidebar-component/sidebar-component';
import { ThemeToggle } from '@shared/components/theme-toggle/theme-toggle';
import { NavigationItem } from '@shared/models/navigation-item';
import { CurrentUserStore } from '@shared/services/current-user-store';
import { map } from 'rxjs';

const MINISTRY_ROLES = [Role.Director, Role.Coordinator, Role.Leader, Role.Apprentice, Role.Sniper];

/** Configuración y Registros retirados viven en Sheepfold; el administrador solo ve ahí catálogos y cuentas. */
const ITEMS: readonly NavigationItem[] = [
  {
    label: 'Calendario',
    icon: 'calendar_month',
    href: `${environment.sheepfoldUrl}/`,
    roles: MINISTRY_ROLES,
  },
  { label: 'Usuarios', icon: 'group', route: '/users', roles: [Role.Admin, Role.Director] },
  {
    label: 'Configuración',
    icon: 'settings',
    href: `${environment.sheepfoldUrl}/settings`,
    roles: [Role.Admin, Role.Director],
  },
  {
    label: 'Registros retirados',
    icon: 'delete',
    href: `${environment.sheepfoldUrl}/retired`,
    roles: [Role.Admin, Role.Director],
  },
  { label: 'Mi perfil', icon: 'person', route: '/' },
];

/**
 * Layout con sesión, con la misma estructura que Sheepfold: menú lateral de 224 px y barra superior con tema y
 * cuenta; bajo 960 px, barra superior compacta y navegación inferior con hasta tres opciones y "Más".
 */
@Component({
  imports: [
    BrandMark,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    SidebarComponent,
    ThemeToggle,
  ],
  selector: 'app-classy-layout',
  template: `
    <a class="tmt-skip-link" href="#contenido">Saltar al contenido</a>

    <mat-sidenav-container class="h-dvh">
      @if (!compact()) {
        <mat-sidenav mode="side" opened class="w-56">
          <app-sidebar-component
            [items]="items()"
            [subtitle]="isManager() ? 'Administración' : 'Mi cuenta'"
          />
        </mat-sidenav>
      }

      <mat-sidenav-content class="flex! flex-col">
        <header
          class="sticky top-0 z-20 flex items-center gap-1 border-b border-border-subtle bg-surface px-3 py-2 md:justify-end md:px-6"
        >
          @if (compact()) {
            <a
              routerLink="/"
              class="mr-auto flex items-center gap-2 text-inherit no-underline"
              aria-label="TMT, inicio"
            >
              <app-brand-mark [size]="36" [decorative]="true" />
              <span class="text-base font-bold">TMT</span>
            </a>
          }

          <app-theme-toggle [compact]="true" />

          <button
            type="button"
            class="ml-1 flex items-center gap-3 rounded-full py-1 pr-2 pl-1 hover:bg-surface-subtle"
            [matMenuTriggerFor]="accountMenu"
            [attr.aria-label]="compact() || !store.user.value() ? 'Cuenta' : null"
          >
            <span class="tmt-avatar h-9! w-9!" aria-hidden="true">{{ initials() }}</span>
            @if (!compact() && store.user.value(); as user) {
              <span class="text-left leading-tight">
                <span class="block text-sm font-medium"
                  >{{ user.firstName }} {{ user.lastName }}</span
                >
                <span class="tmt-meta block">{{ roleLabels[user.role] }}</span>
              </span>
              <mat-icon class="text-secondary" aria-hidden="true">expand_more</mat-icon>
            }
          </button>
          <mat-menu #accountMenu="matMenu" xPosition="before">
            <a mat-menu-item routerLink="/"><mat-icon>person</mat-icon><span>Mi perfil</span></a>
            <button mat-menu-item type="button" (click)="logout()">
              <mat-icon>logout</mat-icon><span>Cerrar sesión</span>
            </button>
          </mat-menu>
        </header>

        <main
          id="contenido"
          tabindex="-1"
          class="flex-1 px-4 py-6 md:px-8 md:py-8"
          [class.pb-24]="compact()"
        >
          <router-outlet />
        </main>

        @if (compact()) {
          <nav
            aria-label="Navegación principal"
            class="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border-subtle bg-surface pb-[env(safe-area-inset-bottom)]"
          >
            @for (item of bottomItems(); track item.label) {
              @if (item.route) {
                <a
                  class="tmt-bottom-link"
                  [routerLink]="item.route"
                  routerLinkActive="is-active"
                  ariaCurrentWhenActive="page"
                  [routerLinkActiveOptions]="{ exact: item.route === '/' }"
                >
                  <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon
                  ><span>{{ item.label }}</span>
                </a>
              } @else {
                <a class="tmt-bottom-link" [href]="item.href">
                  <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon
                  ><span>{{ item.label }}</span>
                </a>
              }
            }
            @if (moreItems().length > 0) {
              <button type="button" class="tmt-bottom-link" [matMenuTriggerFor]="moreMenu">
                <mat-icon aria-hidden="true">more_horiz</mat-icon><span>Más</span>
              </button>
              <mat-menu #moreMenu="matMenu" yPosition="above">
                @for (item of moreItems(); track item.label) {
                  @if (item.route) {
                    <a mat-menu-item [routerLink]="item.route"
                      ><mat-icon>{{ item.icon }}</mat-icon
                      ><span>{{ item.label }}</span></a
                    >
                  } @else {
                    <a mat-menu-item [href]="item.href"
                      ><mat-icon>{{ item.icon }}</mat-icon
                      ><span>{{ item.label }}</span></a
                    >
                  }
                }
              </mat-menu>
            }
          </nav>
        }
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class ClassyLayout {
  protected readonly store = inject(CurrentUserStore);
  protected readonly roleLabels = ROLE_LABELS;

  private readonly _userRoles = inject(UserRolesService);
  private readonly _auth = inject(AuthService);

  /** Menos de 960 px (punto de adaptación "md"). */
  protected readonly compact = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 59.98rem)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  protected readonly items = computed(() =>
    ITEMS.filter((item) => !item.roles || this._userRoles.hasAnyRole(item.roles)),
  );
  protected readonly isManager = computed(() =>
    this._userRoles.hasAnyRole([Role.Admin, Role.Director]),
  );

  /** Móvil: hasta cuatro destinos; con más, tres y el resto en "Más". */
  protected readonly bottomItems = computed(() =>
    this.items().length > 4 ? this.items().slice(0, 3) : this.items(),
  );
  protected readonly moreItems = computed(() =>
    this.items().length > 4 ? this.items().slice(3) : [],
  );

  protected readonly initials = computed(() => {
    const user = this.store.user.value();

    return user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : '';
  });

  constructor() {
    this._userRoles.ensureLoaded();
  }

  protected logout(): void {
    this._auth.logout().subscribe();
  }
}
