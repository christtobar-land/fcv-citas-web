export const getTodayIso = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Convierte formatos ISO (ej. '2026-10-03' o '2026-06-03T10:00:00')
 * a formato legible en español sin ceros a la izquierda en el día:
 * '3 Oct 2026' / '3 Jun 2026'
 */
export const formatDisplayDate = (dateIso?: string | null): string => {
  if (!dateIso) return '';
  const cleanIso = dateIso.includes('T') ? dateIso.split('T')[0] : dateIso;
  const parts = cleanIso.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthName = months[monthIdx] || parts[1];
    return `${day} ${monthName} ${year}`;
  }
  return dateIso;
};

export const formatDateTimeBadge = (dateIso: string, timeStr: string): string => {
  if (!dateIso || !timeStr) return 'Fecha';
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const cleanIso = dateIso.includes('T') ? dateIso.split('T')[0] : dateIso;
  const parts = cleanIso.split('-');
  if (parts.length === 3) {
    const d = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const monthName = months[monthIdx] || parts[1];
    const cleanTime = timeStr.replace(/\s+/g, '');
    return `${d} ${monthName} ${cleanTime}`;
  }
  return `${dateIso} ${timeStr}`;
};

export const formatDateHeading = (dateIso: string): string => {
  if (!dateIso) return '';
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const cleanIso = dateIso.includes('T') ? dateIso.split('T')[0] : dateIso;
  const parts = cleanIso.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dt = new Date(y, m, d);
    const dayName = daysOfWeek[dt.getDay()] || '';
    const monthName = months[m] || parts[1];
    return `${dayName}, ${d} de ${monthName} de ${y}`;
  }
  return dateIso;
};

export const formatTimeFromIso = (iso: string): string => {
  if (!iso) return '';
  const parts = iso.split('T');
  const timePart = parts[1] || '08:00:00';
  const [hh, mm] = timePart.split(':');
  const hNum = parseInt(hh, 10);
  const ampm = hNum >= 12 ? 'PM' : 'AM';
  const h12 = hNum % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${mm} ${ampm}`;
};

export const getUpcomingDays = (
  startDateOrCount?: string | number,
  optionalCount = 3
): { iso: string; label: string }[] => {
  let startDateStr: string | undefined = undefined;
  let count = optionalCount;

  if (typeof startDateOrCount === 'number') {
    count = startDateOrCount;
  } else if (typeof startDateOrCount === 'string') {
    startDateStr = startDateOrCount;
  }

  const result: { iso: string; label: string }[] = [];
  const base =
    startDateStr && typeof startDateStr === 'string' && startDateStr.includes('-')
      ? (() => {
          const [y, m, d] = startDateStr.split('-').map(Number);
          return new Date(y, m - 1, d);
        })()
      : new Date();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  for (let i = 0; i < count; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;
    const label = `${d.getDate()} ${months[d.getMonth()]}`;
    result.push({ iso, label });
  }
  return result;
};

export const getUpcomingBookingDays = (count = 3): { iso: string; label: string }[] => {
  return getUpcomingDays(count);
};
