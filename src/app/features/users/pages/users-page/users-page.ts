import { NgTemplateOutlet } from '@angular/common';
import { HttpStatusCode } from '@angular/common/http';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { debounce, form, FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ACCESS_STATUS_LABELS,
  ProblemDetails,
  Role,
  ROLE_LABELS,
  UserProfile,
  UserRole,
  UserRolesService,
} from '@core/index';
import { UserEditor, UserEditorData } from '@features/users/components/user-editor/user-editor';
import { toUserData, toUserForm } from '@features/users/models';
import { UserService } from '@features/users/services/user-service';
import { ConfirmDialog, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog';
import { CurrentUserStore } from '@shared/services/current-user-store';
import { firstValueFrom, Observable } from 'rxjs';

type StatusFilter = 'all' | 'active' | 'inactive';

interface UserFilters {
  search: string;
  status: StatusFilter;
  role: UserRole | '';
}

/**
 * Usuarios: cuentas con filtros por rol, estado y texto; registro y edición en un panel lateral;
 * solicitud de reinicio de contraseña, activación, desactivación y retiro. La usan el administrador y el
 * director; el director no ve ni asigna el rol Administrador.
 */
@Component({
  imports: [
    FormField,
    MatButtonModule,
    NgTemplateOutlet,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
  ],
  selector: 'app-users-page',
  templateUrl: './users-page.html',
})
export class UsersPage {
  private readonly _users = inject(UserService);
  private readonly _dialog = inject(MatDialog);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _userRoles = inject(UserRolesService);
  private readonly _currentUser = inject(CurrentUserStore);
  private readonly _pageSize = 20;

  protected readonly roleLabels = ROLE_LABELS;
  protected readonly accessLabels = ACCESS_STATUS_LABELS;
  protected readonly currentUserId = computed(() => this._currentUser.user.value()?.id ?? null);

  /** Roles que quien administra puede filtrar y asignar: solo un administrador maneja cuentas Administrador. */
  protected readonly roles = computed<UserRole[]>(() => {
    const all = Object.values(Role);

    return this._userRoles.hasAnyRole([Role.Admin])
      ? all
      : all.filter((role) => role !== Role.Admin);
  });

  protected readonly filters = signal<UserFilters>({ search: '', status: 'all', role: '' });
  protected readonly filtersForm = form(this.filters, (path) => debounce(path.search, 300));

  /** Cambiar cualquier filtro vuelve a la primera página. */
  protected readonly page = linkedSignal({ source: this.filters, computation: () => 1 });

  protected readonly users = rxResource({
    params: () => {
      const { search, status, role } = this.filters();

      return {
        pageNumber: this.page(),
        pageSize: this._pageSize,
        search: search.trim() || undefined,
        isActive: status === 'all' ? undefined : status === 'active',
        role: role || undefined,
      };
    },
    stream: ({ params }) => this._users.getAll(params),
  });

  protected readonly range = computed(() => {
    const result = this.users.value();

    if (!result || result.totalCount === 0) {
      return null;
    }

    const first = (result.pageNumber - 1) * result.pageSize + 1;

    return { first, last: first + result.items.length - 1, total: result.totalCount };
  });

  constructor() {
    this._userRoles.ensureLoaded();
  }

  protected initials(user: UserProfile): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  /** El director no administra cuentas Administrador; nadie se desactiva ni se retira a sí mismo. */
  protected canManage(user: UserProfile): boolean {
    return user.role !== Role.Admin || this._userRoles.hasAnyRole([Role.Admin]);
  }

  protected isSelf(user: UserProfile): boolean {
    return user.id === this.currentUserId();
  }

  protected async create(): Promise<void> {
    await this.openEditor(null, 'Cuenta registrada. Queda pendiente de activación.');
  }

  protected async edit(user: UserProfile): Promise<void> {
    await this.openEditor(user, 'Cuenta actualizada.');
  }

  protected async requestPasswordReset(user: UserProfile): Promise<void> {
    const confirmed = await this.confirm({
      icon: 'lock',
      title: 'Solicitar reinicio de contraseña',
      subject: `${user.firstName} ${user.lastName}`,
      detail: `Usuario: ${user.userName}`,
      message: `${user.firstName} deberá confirmar su identidad y crear personalmente una nueva contraseña.`,
      confirmLabel: 'Solicitar reinicio',
    });

    if (confirmed) {
      await this.run(
        this._users.requestPasswordReset(user.id),
        'Reinicio solicitado. Se cerraron sus sesiones.',
      );
    }
  }

  protected async toggleActive(user: UserProfile): Promise<void> {
    const activating = !user.isActive;
    const confirmed = await this.confirm({
      icon: activating ? 'person_check' : 'person_off',
      title: activating ? 'Activar cuenta' : 'Desactivar cuenta',
      subject: `${user.firstName} ${user.lastName}`,
      message: activating
        ? 'La cuenta podrá volver a ingresar y aparecer en las selecciones.'
        : 'La cuenta no podrá ingresar ni aparecerá en las selecciones. Se cierran sus sesiones; su historial se conserva.',
      confirmLabel: activating ? 'Activar' : 'Desactivar',
      tone: activating ? 'default' : 'danger',
    });

    if (confirmed) {
      const data = { ...toUserData(toUserForm(user)), isActive: activating };

      await this.run(
        this._users.update(user.id, data),
        activating ? 'Cuenta activada.' : 'Cuenta desactivada.',
      );
    }
  }

  protected async retire(user: UserProfile): Promise<void> {
    const confirmed = await this.confirm({
      icon: 'delete',
      title: 'Retirar cuenta',
      subject: `${user.firstName} ${user.lastName}`,
      message:
        'La cuenta pasa a Registros retirados y se cierran sus sesiones. Se puede restaurar mientras se conserve.',
      confirmLabel: 'Retirar',
      tone: 'danger',
    });

    if (confirmed) {
      await this.run(this._users.retire(user.id), 'Cuenta retirada.');
    }
  }

  private confirm(data: ConfirmDialogData): Promise<boolean | undefined> {
    return firstValueFrom(
      this._dialog
        .open(ConfirmDialog, { data, width: '26rem', maxWidth: 'calc(100vw - 2rem)' })
        .afterClosed(),
    );
  }

  private async run(request: Observable<void>, successMessage: string): Promise<void> {
    try {
      await firstValueFrom(request, { defaultValue: undefined });
      this._snackBar.open(successMessage, 'Cerrar', { duration: 4000 });
      this.users.reload();
    } catch (error) {
      const problem = error as ProblemDetails;
      const message =
        problem.status === HttpStatusCode.Conflict || problem.status === HttpStatusCode.BadRequest
          ? problem.detail || 'La acción no se puede aplicar a esta cuenta.'
          : 'No fue posible completar la acción. Intenta de nuevo.';

      this._snackBar.open(message, 'Cerrar', { duration: 6000 });
    }
  }

  private async openEditor(user: UserProfile | null, successMessage: string): Promise<void> {
    const data: UserEditorData = { user, roles: this.roles() };
    const saved = await firstValueFrom(
      this._dialog
        .open(UserEditor, {
          data,
          width: '640px',
          maxWidth: '100vw',
          height: '100%',
          maxHeight: '100dvh',
          position: { right: '0', top: '0' },
          panelClass: 'tmt-side-panel',
          autoFocus: 'first-tabbable',
        })
        .afterClosed(),
    );

    if (saved) {
      this._snackBar.open(successMessage, 'Cerrar', { duration: 4000 });
      this.users.reload();
    }
  }
}
