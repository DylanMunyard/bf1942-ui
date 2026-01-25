/**
 * Parses a date input that can be:
 * - Relative: -7d, -1w, -2w, -1m, -3m (days/weeks/months ago)
 * - Keywords: today, t, yesterday, y
 * - ISO: YYYY-MM-DD (or YY-MM-DD, yy → 20yy if yy<50 else 19yy)
 * - Slash (DD/MM locale): D/M/YY, DD/MM/YY, D/M/YYYY, DD/MM/YYYY. Year: yy → 20yy if yy<50 else 19yy.
 * Returns YYYY-MM-DD or undefined if empty/unparseable.
 */
function twoDigitYearToFull(yy: number): number {
  return yy < 50 ? 2000 + yy : 1900 + yy; // 25→2025, 99→1999, 00→2000, 49→2049, 50→1950
}

export function parseDateInput(value: string | undefined): string | undefined {
  const v = (value ?? '').trim().toLowerCase();
  if (!v) return undefined;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Relative: -Nd, -Nw, -Nm
  const relMatch = v.match(/^-(\d+)(d|w|m)$/);
  if (relMatch) {
    const n = parseInt(relMatch[1], 10);
    const u = relMatch[2];
    const d = new Date(today);
    if (u === 'd') d.setDate(d.getDate() - n);
    else if (u === 'w') d.setDate(d.getDate() - n * 7);
    else if (u === 'm') d.setMonth(d.getMonth() - n);
    return d.toISOString().slice(0, 10);
  }

  // today, t
  if (v === 'today' || v === 't') return today.toISOString().slice(0, 10);
  // yesterday, y
  if (v === 'yesterday' || v === 'y') {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return y.toISOString().slice(0, 10);
  }

  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // ISO YY-MM-DD (2-digit year)
  const isoYY = v.match(/^(\d{2})-(\d{2})-(\d{2})$/);
  if (isoYY) {
    const y = twoDigitYearToFull(parseInt(isoYY[1], 10));
    const m = parseInt(isoYY[2], 10);
    const d = parseInt(isoYY[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const date = new Date(y, m - 1, d);
      if (!isNaN(date.getTime()) && date.getDate() === d) return date.toISOString().slice(0, 10);
    }
  }

  // Slash DD/MM (locale): D/M/YY, DD/MM/YY, D/M/YYYY, DD/MM/YYYY. First=day, second=month.
  const slash = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const first = parseInt(slash[1], 10);
    const second = parseInt(slash[2], 10);
    const yRaw = parseInt(slash[3], 10);
    if (second > 12) return undefined; // invalid month
    const day = first;
    const month = second;
    const y = slash[3].length <= 2 ? twoDigitYearToFull(yRaw) : yRaw;
    if (day < 1 || day > 31) return undefined;
    const d = new Date(y, month - 1, day);
    if (!isNaN(d.getTime()) && d.getDate() === day) return d.toISOString().slice(0, 10);
  }

  return undefined;
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return `Today ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return `Yesterday ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/** DD/MM/YYYY, HH:mm for admin/audit views */
export const formatDateTimeShort = (iso: string): string => {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}; 