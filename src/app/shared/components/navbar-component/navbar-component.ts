import { Component, inject, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { AuthService } from '@features/auth/services/auth-service';

/** Barra superior: abre el menú lateral, lleva al inicio, muestra el usuario y cierra la sesión. */
@Component({
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatToolbarModule, RouterLink],
  selector: 'app-navbar-component',
  styleUrl: './navbar-component.scss',
  templateUrl: './navbar-component.html',
})
export class NavbarComponent {
  /** El usuario pidió abrir o cerrar el menú lateral. */
  public readonly menuToggle = output();

  private readonly _authService = inject(AuthService);

  protected readonly user = rxResource({ stream: () => this._authService.getCurrentUser() }).value;

  protected logout(): void {
    this._authService.logout().subscribe();
  }
}
