export function normalizeText(value: unknown): string {
  return repairMojibake(String(value ?? ''))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function repairMojibake(value: string): string {
  if (!/[\u00c3\u00c2]/.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(
      Array.from(value, (character) => character.charCodeAt(0) & 0xff),
    );

    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return value
      .replace(/\u00c3\u00a1/g, 'a')
      .replace(/\u00c3\u00a9/g, 'e')
      .replace(/\u00c3\u00ad/g, 'i')
      .replace(/\u00c3\u00b3/g, 'o')
      .replace(/\u00c3\u00ba/g, 'u')
      .replace(/\u00c3\u00b1/g, 'n')
      .replace(/\u00c3\u00bc/g, 'u')
      .replace(/\u00c2/g, '');
  }
}

export function normalizeColumnKey(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]/g, '');
}

export function normalizeCurrency(value: unknown): number | null {
  const text = String(value ?? '').trim();
  if (text.length === 0) {
    return null;
  }

  const cleaned = text.replace(/[$\s]/g, '');
  const hasCommaDecimal = /,\d{1,2}$/.test(cleaned);
  const normalized = hasCommaDecimal
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/,/g, '').replace(/\.(?=\d{3}(\D|$))/g, '');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizePercentage(value: unknown): number | null {
  const text = String(value ?? '')
    .replace('%', '')
    .replace(',', '.')
    .trim();
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeBoolean(value: unknown): boolean | null {
  const text = normalizeText(value);
  if (['si', 'sí', 'true', '1', 'x', 'urgente'].includes(text)) {
    return true;
  }
  if (['no', 'false', '0', ''].includes(text)) {
    return false;
  }
  return null;
}

export function normalizePhone(value: unknown): string | null {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

export function normalizeEmail(value: unknown): string | null {
  const text = String(value ?? '')
    .trim()
    .toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : null;
}

export function normalizeDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    excelEpoch.setUTCDate(excelEpoch.getUTCDate() + value);
    return excelEpoch.toISOString().slice(0, 10);
  }

  const text = String(value ?? '').trim();
  const dayFirstMatch = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(text);
  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch;
    const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    const isValid =
      parsed.getUTCFullYear() === Number(year) &&
      parsed.getUTCMonth() === Number(month) - 1 &&
      parsed.getUTCDate() === Number(day);

    return isValid ? parsed.toISOString().slice(0, 10) : null;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}
