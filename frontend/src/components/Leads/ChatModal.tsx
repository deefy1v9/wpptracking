import { X, ExternalLink } from 'lucide-react';
import { useLead } from '../../hooks/useLeads';
import { ChatPanel } from './ChatPanel';
import { StatusBadge, OrigemBadge } from '../ui/Badge';
import { formatPhone } from '../../utils/format';

interface ChatModalProps {
  leadId: number | null;
  onClose: () => void;
}

export function ChatModal({ leadId, onClose }: ChatModalProps) {
  if (leadId === null) return null;
  return <ChatModalInner leadId={leadId} onClose={onClose} />;
}

function ChatModalInner({ leadId, onClose }: { leadId: number; onClose: () => void }) {
  const { data: lead, isLoading } = useLead(leadId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
          {lead ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-gray-200">
                  {(lead.nome ?? lead.telefone).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-sm">{lead.nome ?? 'Sem nome'}</span>
                  <StatusBadge status={lead.status as string} />
                  <OrigemBadge origem={lead.origem} />
                </div>
                <a
                  href={`https://wa.me/${lead.telefone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 mt-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {formatPhone(lead.telefone)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">{isLoading ? 'Carregando...' : 'Lead'}</div>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && <div className="text-gray-500 text-sm text-center py-8">Carregando...</div>}
          {lead && <ChatPanel lead={lead} compact />}
        </div>
      </div>
    </div>
  );
}
