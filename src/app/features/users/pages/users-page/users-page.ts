import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Role } from '@core/index';
import {
  UserFormDialog,
  UserFormDialogData,
} from '@features/users/components/user-form-dialog/user-form-dialog';
import { UserPasswordDialog } from '@features/users/components/user-password-dialog/user-password-dialog';
import { GetUsersRequest, UserResponse } from '@features/users/models';
import { UserService } from '@features/users/services/user-service';
import { firstValueFrom } from 'rxjs';

type StatusFilter = 'all' | 'active' | 'inactive';

interface UserFilters {
  search: string;
  status: StatusFilter;
  role: string;
}

/** Administración de usuarios: búsqueda, alta, edición, contraseña y baja. Exige el rol Admin. */
@Component({
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
  ],
  selector: 'app-users-page',
  styleUrl: './users-page.scss',
  templateUrl: './users-page.html',
})
export class UsersPage {
  private readonly _userService = inject(UserService);
  private readonly _dialog = inject(MatDialog);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _emptyFilters: UserFilters = { search: '', status: 'all', role: '' };
  private readonly _defaultPageSize = 20;

  protected readonly columns = ['name', 'email', 'roles', 'status', 'actions'];
  protected readonly pageSizeOptions = [10, 20, 50, 100];
  /** Roles que se pueden asignar y filtrar: los de `Role`. */
  protected readonly roles: string[] = Object.values(Role);

  protected readonly filters = signal<UserFilters>(this._emptyFilters);
  protected readonly filtersForm = form(this.filters, {
    submission: { action: () => this.search() },
  });

  /** Filtros que se aplicaron con "Buscar" y la página actual: cambiar cualquiera vuelve a consultar. */
  private readonly _query = signal<GetUsersRequest>({
    pageNumber: 1,
    pageSize: this._defaultPageSize,
  });

  protected readonly users = rxResource({
    params: () => this._query(),
    stream: ({ params }) => this._userService.getAll(params),
  });

  protected onPage(event: PageEvent): void {
    this._query.update((query) => ({
      ...query,
      pageNumber: event.pageIndex + 1,
      pageSize: event.pageSize,
    }));
  }

  /** Bloqueado por intentos fallidos de inicio de sesión hasta `lockoutEnd`. */
  protected isLocked(user: UserResponse): boolean {
    return user.lockoutEnd !== null && Date.parse(user.lockoutEnd) > Date.now();
  }

  protected async create(): Promise<void> {
    await this.openForm(null, 'Usuario creado.');
  }

  protected async edit(user: UserResponse): Promise<void> {
    await this.openForm(user, 'Usuario actualizado.');
  }

  protected async setPassword(user: UserResponse): Promise<void> {
    const saved = await firstValueFrom(
      this._dialog.open(UserPasswordDialog, { data: user, width: '28rem' }).afterClosed(),
    );

    if (saved) {
      this._snackBar.open('Contraseña asignada.', 'Cerrar', { duration: 3000 });
      this.users.reload();
    }
  }

  protected async delete(user: UserResponse): Promise<void> {
    try {
      await firstValueFrom(this._userService.delete(user.id), { defaultValue: undefined });
      this._snackBar.open('Usuario eliminado.', 'Cerrar', { duration: 3000 });
      this.users.reload();
    } catch {
      this._snackBar.open('No fue posible eliminar el usuario.', 'Cerrar', { duration: 5000 });
    }
  }

  private async search(): Promise<void> {
    const { search, status, role } = this.filters();

    this._query.update((query) => ({
      pageNumber: 1,
      pageSize: query.pageSize,
      search: search.trim() || undefined,
      isActive: status === 'all' ? undefined : status === 'active',
      role: role || undefined,
    }));
  }

  private async openForm(user: UserResponse | null, successMessage: string): Promise<void> {
    const data: UserFormDialogData = { user, roles: this.roles };
    const saved = await firstValueFrom(
      this._dialog.open(UserFormDialog, { data, width: '40rem' }).afterClosed(),
    );

    if (saved) {
      this._snackBar.open(successMessage, 'Cerrar', { duration: 3000 });
      this.users.reload();
    }
  }
}
