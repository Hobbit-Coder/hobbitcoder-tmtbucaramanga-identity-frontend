import { HttpStatusCode } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  ACCESS_STATUS_LABELS,
  ProblemDetails,
  ROLE_LABELS,
  UserProfile,
  UserRole,
} from '@core/index';
import { ProfileFields } from '@features/auth/components/profile-fields/profile-fields';
import {
  RESPONSIBILITY_LABELS,
  toUserData,
  toUserForm,
  UserForm,
  userRules,
} from '@features/users/models';
import { UserService } from '@features/users/services/user-service';
import { catchError, firstValueFrom, Observable, of } from 'rxjs';

export interface UserEditorData {
  /** `null` para registrar una cuenta nueva. */
  user: UserProfile | null;
  /** Roles que quien edita puede asignar (el director no asigna Administrador). */
  roles: readonly UserRole[];
}

/**
 * Editor de cuentas: datos de la cuenta, rol, estado y el permiso para registrar asistentes. No
 * define contraseñas. Las responsabilidades en grupos se leen de Sheepfold y solo se muestran. Al guardar
 * se cierra con `true`.
 */
@Component({
  imports: [
    FormField,
    FormRoot,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    ProfileFields,
  ],
  selector: 'app-user-editor',
  template: `
    <form class="flex h-full flex-col" [formRoot]="userForm">
      <header class="flex items-center justify-between gap-4 px-6 pt-5">
        <h2 class="m-0 text-xl font-semibold">
          {{ data.user ? 'Editar usuario' : 'Crear usuario' }}
        </h2>
        <button mat-icon-button type="button" mat-dialog-close aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <div class="flex-1 overflow-y-auto px-6 py-4">
        @if (data.user; as user) {
          <div class="mb-5 flex items-center gap-4">
            <span
              class="tmt-avatar h-16! w-16! bg-selection! text-lg! text-selection-text!"
              aria-hidden="true"
              >{{ initials() }}</span
            >
            <div>
              <p class="m-0 text-lg font-semibold">{{ user.firstName }} {{ user.lastName }}</p>
              <p class="tmt-meta m-0 text-sm!">
                {{ roleLabels[user.role] }} · {{ user.isActive ? 'Activo' : 'Inactivo' }} ·
                {{ accessLabels[user.accessStatus] }}
              </p>
            </div>
          </div>
        } @else {
          <p class="tmt-alert mt-0 mb-5">
            <mat-icon class="text-info">info</mat-icon
            ><span
              >La cuenta queda pendiente de activación: su titular confirmará su identidad con un
              código, creará su contraseña y completará su perfil.</span
            >
          </p>
        }

        <app-profile-fields [fields]="userForm.profile" />

        <div class="mt-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Rol</mat-label>
            <mat-select [formField]="userForm.role">
              @for (role of data.roles; track role) {
                <mat-option [value]="role">{{ roleLabels[role] }}</mat-option>
              }
            </mat-select>
            <mat-error>{{ userForm.role().errors()[0]?.message }}</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Estado</mat-label>
            <mat-select [formField]="userForm.isActive">
              <mat-option [value]="true">Activo</mat-option>
              <mat-option [value]="false">Inactivo</mat-option>
            </mat-select>
            <mat-hint>Inactivo no puede ingresar ni aparece en las selecciones.</mat-hint>
          </mat-form-field>
        </div>

        @if (data.user) {
          <section class="mt-5" aria-labelledby="responsibilities-title">
            <h3 id="responsibilities-title" class="m-0 text-sm font-medium">Responsabilidades</h3>
            <p class="tmt-meta m-0 mb-2">Se asignan en Sheepfold, desde el equipo de cada grupo.</p>
            @if (responsibilities.isLoading()) {
              <div class="tmt-skeleton h-8 w-48" aria-label="Cargando responsabilidades"></div>
            } @else if (responsibilities.value(); as list) {
              @if (list.length === 0) {
                <p class="m-0 text-sm text-secondary">Sin responsabilidades en grupos.</p>
              } @else {
                <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
                  @for (item of list; track item.groupId + item.responsibility) {
                    <li class="tmt-pill" [class.is-accent]="item.isActive">
                      {{ responsibilityLabels[item.responsibility] }} · {{ item.generationName }}
                      {{ item.name }} · {{ item.year }}{{ item.isActive ? '' : ' (inactivo)' }}
                    </li>
                  }
                </ul>
              }
            } @else {
              <p class="m-0 text-sm text-secondary">
                No fue posible consultar las responsabilidades en Sheepfold.
              </p>
            }
          </section>
        }

        <div class="mt-5 flex items-start gap-3">
          <mat-slide-toggle
            [formField]="userForm.canRegisterAttendees"
            aria-describedby="can-register-hint"
            >Puede registrar nuevos asistentes</mat-slide-toggle
          >
        </div>
        <p id="can-register-hint" class="tmt-meta m-0 mt-1 pl-[3.25rem]">
          No amplía el alcance de edición.
        </p>

        @if (errorMessage(); as message) {
          <p class="tmt-alert is-error mt-4 mb-0" role="alert">
            <mat-icon class="text-error">error</mat-icon><span>{{ message }}</span>
          </p>
        }
      </div>

      <footer class="grid grid-cols-2 gap-3 border-t border-border-subtle px-6 py-4">
        <button mat-stroked-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="userForm().submitting()">
          {{ data.user ? 'Guardar' : 'Crear usuario' }}
        </button>
      </footer>
    </form>
  `,
})
export class UserEditor {
  protected readonly data = inject<UserEditorData>(MAT_DIALOG_DATA);
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly accessLabels = ACCESS_STATUS_LABELS;
  protected readonly responsibilityLabels = RESPONSIBILITY_LABELS;

  protected readonly model = signal<UserForm>(toUserForm(this.data.user));
  protected readonly userForm = form(this.model, (path) => userRules(path, () => new Date()), {
    submission: { action: () => this.save() },
  });
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly initials = computed(() => {
    const { firstName, lastName } = this.model().profile;

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  });

  private readonly _users = inject(UserService);
  private readonly _dialogRef = inject(MatDialogRef<UserEditor, boolean>);

  /** Si Sheepfold no responde, el editor sigue funcionando y lo indica. */
  protected readonly responsibilities = rxResource({
    params: () => this.data.user?.id,
    stream: ({ params }) =>
      this._users.getResponsibilities(params).pipe(catchError(() => of(undefined))),
  });

  private async save(): Promise<void> {
    this.errorMessage.set(null);

    try {
      const data = toUserData(this.model());

      const request: Observable<unknown> = this.data.user
        ? this._users.update(this.data.user.id, data)
        : this._users.create(data);

      await firstValueFrom(request, { defaultValue: undefined });
      this._dialogRef.close(true);
    } catch (error) {
      this.errorMessage.set(this.toMessage(error as ProblemDetails));
    }
  }

  private toMessage(problem: ProblemDetails): string {
    switch (problem.status) {
      case HttpStatusCode.Conflict:
        return 'El teléfono, el usuario o el correo ya pertenecen a otra cuenta.';
      case HttpStatusCode.Forbidden:
        return 'No puedes administrar esta cuenta o asignar ese rol.';
      case HttpStatusCode.BadRequest:
        return problem.detail || 'Revisa los datos de la cuenta.';
      default:
        return 'No fue posible guardar la cuenta. Intenta de nuevo.';
    }
  }
}
