import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '@shared/components/footer-component/footer-component';
import { NavbarComponent } from '@shared/components/navbar-component/navbar-component';
import { SidebarComponent } from '@shared/components/sidebar-component/sidebar-component';
import { map } from 'rxjs';

/**
 * Layout de las páginas con sesión: barra superior, menú lateral y pie. En pantallas pequeñas el menú
 * se superpone al contenido y se cierra al elegir una opción.
 */
@Component({
  imports: [RouterOutlet, MatSidenavModule, NavbarComponent, SidebarComponent, FooterComponent],
  selector: 'app-classy-layout',
  styleUrl: './classy-layout.scss',
  templateUrl: './classy-layout.html',
})
export class ClassyLayout {
  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe(Breakpoints.Handset)
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
}
