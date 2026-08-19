export {
  formatCurrency,
  formatDate,
  formatNumber,
  maskPhone,
} from '../../office/utils/office.formatters';

export function maskEmail(value?: string): string | undefined {
  if (!value) return undefined;
  const [user, domain] = value.split('@');
  if (!user || !domain) return value;
  return `${user.slice(0, 2)}***@${domain}`;
}

export function maskAddress(value: string): string {
  const parts = value.trim().split(/\s+/);
  if (parts.length <= 2) return value;
  return `${parts.slice(0, 2).join(' ')} ***`;
}
