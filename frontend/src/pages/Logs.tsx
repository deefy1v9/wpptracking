import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { logsService } from '../services/api';
import { SourceBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatDateTime } from '../utils/format';
import type { WebhookLog } from '../types';

export default function Logs() {
  const [page, setPage] = useState(1);
  const [source, setSource] = useState('');
  const [processed, setProcessed] = useState('');
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const LIMIT = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['logs', page, source, processed],
    queryFn: () =>
      logsService
        .list({ source: source || undefined, processed: processed || undefined, page, limit: LIMIT })
        .then((r) => r.data),
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-wrap gap-3">
        <select
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
          value={source}
          onChange={(e) => { setSource(e.target.value); setPage(1); }}
        >
          <option value="">Todas as fontes</option>
          <option value="whatsapp_cloud">WhatsApp Cloud</option>
          <option value="evolution">Evolution API</option>
          <option value="cloudia">Cloudia</option>
        </select>

        <select
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
          value={processed}
          onChange={(e) => { setProcessed(e.target.value); setPage(1); }}
        >
          <option value="">Todos</option>
          <option value="true">Processados</option>
          <option value="false">Não processados</option>
        </select>

        <span className="text-sm text-gray-500 self-center ml-auto">
          {isLoading ? '...' : `${data?.total ?? 0} registros`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data/Hora</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fonte</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Erro</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Carregando...</td></tr>
              ) : data?.logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Nenhum log encontrado</td></tr>
              ) : (
                data?.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <SourceBadge source={log.source} />
                    </td>
                    <td className="px-4 py-3">
                      {log.processed ? (
                        <span className="text-xs text-green-400">✓ Processado</span>
                      ) : (
                        <span className="text-xs text-red-400">✗ Falhou</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-red-400 max-w-xs truncate">
                      {log.error ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payload modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Payload do Webhook"
        size="xl"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            {selectedLog && <SourceBadge source={selectedLog.source} />}
            <span className="text-xs text-gray-500">
              {formatDateTime(selectedLog?.created_at)}
            </span>
          </div>
          <pre className="bg-gray-950 border border-gray-700 rounded-lg p-4 text-xs text-green-400 overflow-auto max-h-96 font-mono leading-relaxed">
            {selectedLog
              ? JSON.stringify(selectedLog.payload, null, 2)
              : ''}
          </pre>
          {selectedLog?.error && (
            <div className="mt-3 bg-red-900/20 border border-red-700/30 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-400 mb-1">Erro:</p>
              <p className="text-xs text-red-300">{selectedLog.error}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
