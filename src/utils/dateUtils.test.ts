import { describe, expect, it } from 'vitest';
import {
  formatDisplayDate,
  formatDateTimeBadge,
  formatDateHeading,
  formatTimeFromIso,
  getTodayIso,
  getUpcomingDays,
  getUpcomingBookingDays,
} from './dateUtils';

describe('dateUtils - Utilidades y formateo de fechas', () => {
  it('formatea fechas ISO a formato legible "3 Oct 2026" / "3 Jun 2026" sin ceros a la izquierda en el día', () => {
    expect(formatDisplayDate('2026-10-03')).toBe('3 Oct 2026');
    expect(formatDisplayDate('2026-06-03')).toBe('3 Jun 2026');
    expect(formatDisplayDate('2026-01-15')).toBe('15 Ene 2026');
    expect(formatDisplayDate('2026-12-31')).toBe('31 Dic 2026');
  });

  it('soporta cadenas ISO completas con fecha y hora (ej. 2026-10-03T14:30:00)', () => {
    expect(formatDisplayDate('2026-10-03T14:30:00')).toBe('3 Oct 2026');
    expect(formatDisplayDate('2026-06-03T08:00:00Z')).toBe('3 Jun 2026');
  });

  it('retorna cadena vacía para valores nulos o indefinidos', () => {
    expect(formatDisplayDate(null)).toBe('');
    expect(formatDisplayDate(undefined)).toBe('');
    expect(formatDisplayDate('')).toBe('');
  });

  it('formatea badge de fecha y hora correctamente', () => {
    expect(formatDateTimeBadge('2026-10-03', '08:30 AM')).toBe('3 Oct 08:30AM');
    expect(formatDateTimeBadge('2026-06-03', '02:00 PM')).toBe('3 Jun 02:00PM');
  });

  it('formatea horas desde ISO a formato 12 horas con AM/PM', () => {
    expect(formatTimeFromIso('2026-10-03T08:30:00')).toBe('08:30 AM');
    expect(formatTimeFromIso('2026-10-03T14:15:00')).toBe('02:15 PM');
    expect(formatTimeFromIso('2026-10-03T00:00:00')).toBe('12:00 AM');
    expect(formatTimeFromIso('2026-10-03T12:00:00')).toBe('12:00 PM');
  });

  it('genera días venideros válidos con etiquetas limpias', () => {
    const daysFromStart = getUpcomingDays('2026-10-03', 3);
    expect(daysFromStart).toHaveLength(3);
    expect(daysFromStart[0]).toEqual({ iso: '2026-10-03', label: '3 Oct' });
    expect(daysFromStart[1]).toEqual({ iso: '2026-10-04', label: '4 Oct' });
    expect(daysFromStart[2]).toEqual({ iso: '2026-10-05', label: '5 Oct' });

    const bookingDays = getUpcomingBookingDays(2);
    expect(bookingDays).toHaveLength(2);
    expect(bookingDays[0].iso).toBe(getTodayIso());
  });
});
