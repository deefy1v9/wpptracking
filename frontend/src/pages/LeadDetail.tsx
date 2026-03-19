import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useLead } from '../hooks/useLeads';
import { OrigemBadge } from '../components/ui/Badge';
import { ChatPanel } from '../components/Leads/ChatPanel';
import { formatPhone } from '../utils/format';

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const leadId = parseInt(id ?? '0', 10);

  const { data: lead, isLoading } = useLead(leadId);

  if (isLoading) {
    return <div className="text-gray-400 p-6">Carregando...</div>;
  }

  if (!lead) {
    return (
      <div className="text-gray-400 p-6">
        Lead não encontrado.{' '}
        <Link to="/leads" className="text-blue-400 hover:underline">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link
        to="/leads"
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para leads
      </Link>

      {/* Lead header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{lead.nome ?? 'Sem nome'}</h2>
            <a
              href={`https://wa.me/${lead.telefone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-green-400 hover:text-green-300 mt-0.5"
            >
              {formatPhone(lead.telefone)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <OrigemBadge origem={lead.origem} size="md" />
        </div>
      </div>

      {/* Chat panel with status, ad data, timeline, CAPI */}
      <ChatPanel lead={lead} />
    </div>
  );
}
