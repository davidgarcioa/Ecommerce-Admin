export function isValidTrackingNumber(value: string): boolean {
  const normalized = value.trim();
  return normalized.length === 0 || /^[a-zA-Z0-9-]{4,40}$/.test(normalized);
}

export function isValidCarrier(value: string): boolean {
  return value.trim().length <= 80;
}
