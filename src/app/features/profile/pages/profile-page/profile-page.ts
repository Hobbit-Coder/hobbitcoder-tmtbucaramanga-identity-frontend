import { HttpStatusCode } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { form, FormRoot } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ProblemDetails, ROLE_LABELS, SessionService } from '@core/index';
import { ThemePreference, ThemeService } from '@core/services/theme-service';
import { ProfileFields } from '@features/auth/components/profile-fields/profile-fields';
import {
  emptyProfileForm,
  ProfileForm,
  profileRules,
  toProfileData,
  toProfileForm,
} from '@features/auth/models/profile-form';
import { AuthService } from '@features/auth/services/auth-service';
import { ChangePasswordDialog } from '@features/profile/components/change-password-dialog/change-password-dialog';
import { CurrentUserStore } from '@shared/services/current-user-store';
import { firstValueFrom } from 'rxjs';

/**
 * Mi perfil: información personal, rol en lectura, tema de la interfaz y cambio de contraseña.
 * Lo usa cualquier cuenta, incluida la del administrador.
 */
@Component({
  imports: [FormRoot, MatButtonModule, MatButtonToggleModule, MatIconModule, ProfileFields],
  selector: 'app-profile-page',
  templateUrl: './profile-page.html',
})
export class ProfilePage {
  private readonly _store = inject(CurrentUserStore);
  private readonly _auth = inject(AuthService);
  private readonly _session = inject(SessionService);
  private readonly _dialog = inject(MatDialog);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _router = inject(Router);

  protected readonly theme = inject(ThemeService);
  protected readonly user = this._store.user;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'Sistema' },
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
  ];

  protected readonly profile = signal<ProfileForm>(emptyProfileForm());
  protected readonly profileForm = form(
    this.profile,
    (path) => profileRules(path, () => new Date()),
    {
      submission: { action: () => this.save() },
    },
  );
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly initials = computed(() => {
    const user = this.user.value();

    return user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : '';
  });

  /**
   * Carga los datos guardados cada vez que llegan de Identity (al entrar y después de guardar).
   */
  constructor() {
    effect(() => {
      const user = this.user.value();

      if (user) {
        this.profile.set(toProfileForm(user));
      }
    });
  }

  /**
   * Identity ya revocó las sesiones: se cierra la local y se vuelve a ingresar con la contraseña nueva.
   */
  protected async changePassword(): Promise<void> {
    const changed = await firstValueFrom(
      this._dialog
        .open(ChangePasswordDialog, { width: '28rem', maxWidth: 'calc(100vw - 2rem)' })
        .afterClosed(),
    );

    if (changed) {
      this._session.end();
      await this._router.navigate(['/auth/sign-in'], { queryParams: { notice: 'password' } });
    }
  }

  private async save(): Promise<void> {
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this._auth.updateProfile(toProfileData(this.profile())), {
        defaultValue: undefined,
      });
      this._store.reload();
      this._snackBar.open('Perfil actualizado.', 'Cerrar', { duration: 4000 });
    } catch (error) {
      const problem = error as ProblemDetails;

      this.errorMessage.set(
        problem.status === HttpStatusCode.Conflict
          ? 'El teléfono, el usuario o el correo ya pertenecen a otra cuenta.'
          : 'No fue posible guardar tu perfil. Revisa los datos e intenta de nuevo.',
      );
    }
  }
}
