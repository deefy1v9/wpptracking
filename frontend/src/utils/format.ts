import { format, parseISO, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

const TZ = 'America/Sao_Paulo';

function safeParseDate(isoStr: string | null | undefined): Date | null {
  if (!isoStr) return null;
  try {
    const d = parseISO(isoStr);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

export function formatDateTime(isoStr: string | null | undefined): string {
  const d = safeParseDate(isoStr);
  if (!d) return '—';
  const zoned = toZonedTime(d, TZ);
  return format(zoned, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatDate(isoStr: string | null | undefined): string {
  const d = safeParseDate(isoStr);
  if (!d) return '—';
  const zoned = toZonedTime(d, TZ);
  return format(zoned, 'dd/MM/yyyy', { locale: ptBR });
}

export function formatTime(isoStr: string | null | undefined): string {
  const d = safeParseDate(isoStr);
  if (!d) return '—';
  const zoned = toZonedTime(d, TZ);
  return format(zoned, 'HH:mm', { locale: ptBR });
}

export function formatRelative(isoStr: string | null | undefined): string {
  const d = safeParseDate(isoStr);
  if (!d) return '—';
  const zoned = toZonedTime(d, TZ);
  const now = toZonedTime(new Date(), TZ);
  const diffMs = now.getTime() - zoned.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h atrás`;
  return format(zoned, "dd/MM", { locale: ptBR });
}

export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('55')) {
    const local = d.slice(2);
    if (local.length === 11) {
      return `+55 (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
    }
    return `+55 (${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return phone;
}

export function maskToken(token: string | null | undefined): string {
  if (!token || token.length <= 4) return '****';
  if (token.startsWith('****')) return token;
  return '****' + token.slice(-4);
}

export function truncate(text: string | null | undefined, maxLen = 60): string {
  if (!text) return '—';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}
