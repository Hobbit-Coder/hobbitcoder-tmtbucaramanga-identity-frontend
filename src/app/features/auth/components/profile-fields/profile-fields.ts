import { Component, computed, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { dayFromPicker, GENDER_LABELS, Gender, ROLE_LABELS, UserRole } from '@core/index';
import { ageOn, ProfileForm } from '@features/auth/models/profile-form';

/**
 * Campos del perfil propio (§5): los usa el primer ingreso y Mi perfil. El rol y la edad se muestran en
 * lectura: el rol lo asigna la administración y la edad se calcula con la fecha de nacimiento.
 */
@Component({
  imports: [
    FormField,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  selector: 'app-profile-fields',
  host: {
    class: 'grid grid-cols-1 items-start gap-x-4 gap-y-4',
    '[class.sm:grid-cols-2]': 'columns() === 2',
  },
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Nombres</mat-label>
      <input matInput autocomplete="given-name" [formField]="fields().firstName" />
      <mat-error>{{ fields().firstName().errors()[0]?.message }}</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Apellidos</mat-label>
      <input matInput autocomplete="family-name" [formField]="fields().lastName" />
      <mat-error>{{ fields().lastName().errors()[0]?.message }}</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Género</mat-label>
      <mat-select [formField]="fields().gender">
        @for (gender of genders; track gender) {
          <mat-option [value]="gender">{{ genderLabels[gender] }}</mat-option>
        }
      </mat-select>
      <mat-error>{{ fields().gender().errors()[0]?.message }}</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Teléfono</mat-label>
      <input matInput type="tel" autocomplete="tel" [formField]="fields().phoneNumber" />
      <mat-hint>Recibe los códigos de seguridad.</mat-hint>
      <mat-error>{{ fields().phoneNumber().errors()[0]?.message }}</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Nombre de usuario</mat-label>
      <input matInput autocomplete="username" [formField]="fields().userName" />
      <mat-error>{{ fields().userName().errors()[0]?.message }}</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Correo (opcional)</mat-label>
      <input matInput type="email" autocomplete="email" [formField]="fields().email" />
      <mat-error>{{ fields().email().errors()[0]?.message }}</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Instagram</mat-label>
      <input matInput autocomplete="off" placeholder="@usuario" [formField]="fields().instagram" />
      <mat-error>{{ fields().instagram().errors()[0]?.message }}</mat-error>
    </mat-form-field>

    <div class="grid grid-cols-[1fr_6rem] gap-3">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Fecha de nacimiento</mat-label>
        <input
          matInput
          autocomplete="bday"
          [matDatepicker]="birthDatePicker"
          [formField]="fields().birthDate"
        />
        <mat-datepicker-toggle matIconSuffix [for]="birthDatePicker" />
        <mat-datepicker #birthDatePicker startView="multi-year" />
        <mat-error>{{ fields().birthDate().errors()[0]?.message }}</mat-error>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Edad</mat-label>
        <input
          matInput
          readonly
          class="tmt-numeric"
          [value]="age() ?? '—'"
          aria-description="Se calcula con la fecha de nacimiento"
        />
      </mat-form-field>
    </div>

    @if (role(); as currentRole) {
      <mat-form-field
        appearance="outline"
        subscriptSizing="dynamic"
        [class.sm:col-span-2]="columns() === 2"
      >
        <mat-label>Rol</mat-label>
        <mat-icon matPrefix class="mx-2 text-secondary">badge</mat-icon>
        <input matInput readonly [value]="roleLabels[currentRole]" />
        <mat-hint>Lo asigna la administración de cuentas.</mat-hint>
      </mat-form-field>
    }
  `,
})
export class ProfileFields {
  public readonly fields = input.required<FieldTree<ProfileForm>>();
  public readonly role = input<UserRole | null>(null);

  /** Dos columnas desde 600 px; una en contenedores angostos (primer ingreso). */
  public readonly columns = input<1 | 2>(2);

  /** Fecha local de hoy; se inyecta para poder fijarla en pruebas. */
  public readonly today = input<Date>(new Date());

  protected readonly age = computed(() =>
    ageOn(dayFromPicker(this.fields().birthDate().value()), this.today()),
  );
  protected readonly genders = Object.keys(GENDER_LABELS) as Gender[];
  protected readonly genderLabels = GENDER_LABELS;
  protected readonly roleLabels = ROLE_LABELS;
}
