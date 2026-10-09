import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { BrandMark } from '@shared/components/brand-mark/brand-mark';
import { SidebarComponent } from '@shared/components/sidebar-component/sidebar-component';
import { map } from 'rxjs';

/**
 * Layout con sesión (manual §6): menú lateral fijo de 224 px desde 960 px; en pantallas menores, barra
 * superior con la marca y el menú como panel superpuesto que se cierra al elegir una opción.
 */
@Component({
  imports: [
    BrandMark,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    RouterOutlet,
    SidebarComponent,
  ],
  selector: 'app-classy-layout',
  template: `
    <mat-sidenav-container class="h-dvh">
      <mat-sidenav
        #sidenav
        class="w-56"
        [mode]="compact() ? 'over' : 'side'"
        [opened]="!compact()"
        [fixedInViewport]="compact()"
      >
        <app-sidebar-component (navigated)="compact() && sidenav.close()" />
      </mat-sidenav>

      <mat-sidenav-content class="flex! flex-col">
        @if (compact()) {
          <header
            class="sticky top-0 z-10 flex items-center gap-2 border-b border-border-subtle bg-surface px-2 py-2"
          >
            <button
              mat-icon-button
              type="button"
              aria-label="Abrir el menú"
              (click)="sidenav.open()"
            >
              <mat-icon>menu</mat-icon>
            </button>
            <app-brand-mark [size]="36" [decorative]="true" />
            <span class="text-base font-bold">TMT</span>
          </header>
        }
        <main id="contenido" class="flex-1 px-4 py-6 md:px-8 md:py-8">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class ClassyLayout {
  /** Menos de 960 px (punto de adaptación "md" del manual). */
  protected readonly compact = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 59.98rem)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
}
