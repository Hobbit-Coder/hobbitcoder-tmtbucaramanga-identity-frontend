import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BrandMark } from '@shared/components/brand-mark/brand-mark';
import { NavigationItem } from '@shared/models/navigation-item';

/**
 * Menú lateral de escritorio: marca y las opciones que el layout ya filtró por rol. La cuenta, el tema y el
 * cierre de sesión están en la barra superior, igual que en Sheepfold.
 */
@Component({
  imports: [BrandMark, MatIconModule, RouterLink, RouterLinkActive],
  selector: 'app-sidebar-component',
  host: { class: 'flex h-full flex-col bg-surface' },
  template: `
    <a routerLink="/" class="flex items-center gap-3 px-4 pt-5 pb-6 text-inherit no-underline">
      <app-brand-mark [size]="48" [decorative]="true" />
      <span class="leading-tight">
        <span class="block text-lg font-bold">TMT</span>
        <span class="block text-sm text-secondary">{{ subtitle() }}</span>
      </span>
    </a>

    <nav aria-label="Menú principal" class="flex-1 overflow-y-auto px-3">
      <ul class="m-0 flex list-none flex-col gap-1 p-0">
        @for (item of items(); track item.label) {
          <li>
            @if (item.route) {
              <a
                class="tmt-nav-link"
                [routerLink]="item.route"
                routerLinkActive="is-active"
                ariaCurrentWhenActive="page"
                [routerLinkActiveOptions]="{ exact: item.route === '/' }"
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
  `,
})
export class SidebarComponent {
  public readonly items = input.required<readonly NavigationItem[]>();
  public readonly subtitle = input('');
}
