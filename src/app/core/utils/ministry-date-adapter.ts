import { Injectable } from '@angular/core';
import { MAT_NATIVE_DATE_FORMATS, MatDateFormats, NativeDateAdapter } from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';

const TIME_24H: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
};

/** Formatos de los selectores de fecha y hora: los de Material con la hora en 24 h. */
export const MINISTRY_DATE_FORMATS: MatDateFormats = {
  ...MAT_NATIVE_DATE_FORMATS,
  display: {
    ...MAT_NATIVE_DATE_FORMATS.display,
    timeInput: TIME_24H,
    timeOptionLabel: TIME_24H,
  },
};

const DAY_MONTH_YEAR = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;

/**
 * Adaptador de los selectores de Material: la semana empieza el lunes y lo escrito se lee como
 * día/mes/año ("14/10/2026"), el mismo orden con que es-CO muestra la fecha.
 */
@Injectable()
export class MinistryDateAdapter extends NativeDateAdapter {
  public override getFirstDayOfWeek(): number {
    return 1;
  }

  /**
   * 31/02/2026 no existe: se informa como fecha inválida en lugar de correrla a marzo.
   */
  public override parse(value: unknown, parseFormat?: unknown): Date | null {
    const match = typeof value === 'string' ? DAY_MONTH_YEAR.exec(value.trim()) : null;

    if (!match) {
      return super.parse(value, parseFormat);
    }

    const [day, month, year] = match.slice(1).map(Number);
    const date = new Date(year, month - 1, day);

    return date.getMonth() === month - 1 ? date : this.invalid();
  }
}

/** Textos de los selectores de fecha para lectores de pantalla; Material los trae en inglés. */
@Injectable()
export class MinistryDatepickerIntl extends MatDatepickerIntl {
  public override calendarLabel = 'Calendario';
  public override openCalendarLabel = 'Abrir calendario';
  public override closeCalendarLabel = 'Cerrar calendario';
  public override prevMonthLabel = 'Mes anterior';
  public override nextMonthLabel = 'Mes siguiente';
  public override prevYearLabel = 'Año anterior';
  public override nextYearLabel = 'Año siguiente';
  public override prevMultiYearLabel = 'Años anteriores';
  public override nextMultiYearLabel = 'Años siguientes';
  public override switchToMonthViewLabel = 'Elegir fecha';
  public override switchToMultiYearViewLabel = 'Elegir mes y año';
}