import { Megaphone, MessageCircle } from 'lucide-react';
import type { LeadStatus, LeadOrigem, WebhookSource } from '../../types';

interface StatusBadgeProps {
  status: LeadStatus | string | null;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  novo: { label: 'Novo', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  em_atendimento: { label: 'Em Atendimento', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  qualificado: { label: 'Qualificado', className: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
  ganho: { label: 'Ganho', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  perdido: { label: 'Perdido', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status ?? ''] ?? { label: status ?? '—', className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' };
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${padding} ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

interface OrigemBadgeProps {
  origem: LeadOrigem | string | null;
  size?: 'sm' | 'md';
}

export function OrigemBadge({ origem, size = 'sm' }: OrigemBadgeProps) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  if (origem === 'anuncio') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium ${padding} bg-green-500/20 text-green-400 border border-green-500/30`}>
        <Megaphone className="w-3 h-3" />
        Anúncio
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${padding} bg-gray-500/20 text-gray-400 border border-gray-500/30`}>
      <MessageCircle className="w-3 h-3" />
      Orgânico
    </span>
  );
}

interface SourceBadgeProps {
  source: WebhookSource;
}

const SOURCE_CONFIG: Record<WebhookSource, { label: string; className: string }> = {
  whatsapp_cloud: { label: 'WhatsApp Cloud', className: 'bg-green-500/20 text-green-400' },
  evolution: { label: 'Evolution API', className: 'bg-blue-500/20 text-blue-400' },
  cloudia: { label: 'Cloudia', className: 'bg-purple-500/20 text-purple-400' },
};

export function SourceBadge({ source }: SourceBadgeProps) {
  const cfg = SOURCE_CONFIG[source] ?? { label: source, className: 'bg-gray-500/20 text-gray-400' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
