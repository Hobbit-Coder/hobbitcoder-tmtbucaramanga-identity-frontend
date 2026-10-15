import { Injectable } from '@angular/core';
import { MAT_NATIVE_DATE_FORMATS, MatDateFormats, NativeDateAdapter } from '@angular/material/core';

const TIME_24H: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
};

/** Formatos de los selectores de fecha y hora: los de Material con la hora en 24 h (§8 del manual). */
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
 * Adaptador de los selectores de Material: la semana empieza el lunes (§10) y lo escrito se lee como
 * día/mes/año ("14/10/2026"), el mismo orden con que es-CO muestra la fecha.
 */
@Injectable()
export class MinistryDateAdapter extends NativeDateAdapter {
  public override getFirstDayOfWeek(): number {
    return 1;
  }

  public override parse(value: unknown, parseFormat?: unknown): Date | null {
    const match = typeof value === 'string' ? DAY_MONTH_YEAR.exec(value.trim()) : null;

    if (!match) {
      return super.parse(value, parseFormat);
    }

    const [day, month, year] = match.slice(1).map(Number);
    const date = new Date(year, month - 1, day);

    // 31/02/2026 no existe: se informa como fecha inválida en lugar de correrla a marzo.
    return date.getMonth() === month - 1 ? date : this.invalid();
  }
}
