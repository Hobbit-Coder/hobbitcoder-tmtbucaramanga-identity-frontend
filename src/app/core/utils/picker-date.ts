const pad = (value: number) => String(value).padStart(2, '0');

/*
 * Valores del selector de fecha de Material. El adaptador nativo trabaja con `Date` en la zona del navegador,
 * así que el día viaja en componentes locales: lo elegido es exactamente el día escrito, sin conversión de zona.
 */

/** `Date` del selector para un día `yyyy-MM-dd`; `null` si no hay día. */
export function pickerDate(day: string | null | undefined): Date | null {
  if (!day) {
    return null;
  }

  const [year, month, date] = day.split('-').map(Number);

  return new Date(year, month - 1, date);
}

/** Día `yyyy-MM-dd` elegido en el selector; vacío si no hay fecha. */
export function dayFromPicker(date: Date | null): string {
  return date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : '';
}
