import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@features/auth/services/auth-service';

/** Cuenta del usuario autenticado en Identity. */
@Component({
  imports: [MatButtonModule],
  selector: 'app-home-page',
  styleUrl: './home-page.scss',
  templateUrl: './home-page.html',
})
export class HomePage {
  private readonly _authService = inject(AuthService);

  protected readonly user = rxResource({ stream: () => this._authService.getCurrentUser() });
  protected readonly roles = computed(() => this.user.value()?.roles.join(', ') ?? '');

  protected logout(): void {
    this._authService.logout().subscribe();
  }
}
