import { Users, TrendingUp, Calendar, Target, Megaphone } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useStats } from '../hooks/useStats';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge, OrigemBadge } from '../components/ui/Badge';
import { formatRelative } from '../utils/format';
import { Link } from 'react-router-dom';

const ORIGEM_COLORS: Record<string, string> = {
  anuncio: '#22c55e',
  organico: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
  novo: '#3b82f6',
  em_atendimento: '#eab308',
  qualificado: '#a855f7',
  ganho: '#22c55e',
  perdido: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  em_atendimento: 'Em Atend.',
  qualificado: 'Qualif.',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (!stats) return null;

  const origemData = Object.entries(stats.by_origem).map(([key, value]) => ({
    name: key === 'anuncio' ? 'Anúncio' : 'Orgânico',
    value,
    key,
  }));

  const statusData = Object.entries(stats.by_status).map(([key, value]) => ({
    name: STATUS_LABELS[key] ?? key,
    value,
    key,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Leads Hoje"
          value={stats.leads_hoje}
          icon={Calendar}
          iconColor="text-blue-400"
        />
        <KpiCard
          title="Leads na Semana"
          value={stats.leads_semana}
          icon={Users}
          iconColor="text-green-400"
        />
        <KpiCard
          title="Leads no Mês"
          value={stats.leads_mes}
          icon={TrendingUp}
          iconColor="text-purple-400"
        />
        <KpiCard
          title="Taxa de Conversão"
          value={`${stats.taxa_conversao}%`}
          subtitle={`${stats.total} leads no total`}
          icon={Target}
          iconColor="text-yellow-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Origem Pie */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Leads por Origem</h3>
          {origemData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={origemData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {origemData.map((entry) => (
                    <Cell key={entry.key} fill={ORIGEM_COLORS[entry.key] ?? '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Leads por Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData} barSize={28}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  itemStyle={{ color: '#e5e7eb' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Campanhas */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-green-400" />
            Top 5 Campanhas
          </h3>
          {stats.top_campanhas.length > 0 ? (
            <div className="space-y-2">
              {stats.top_campanhas.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-300 truncate flex-1 mr-4">{c.campanha}</span>
                  <span className="text-sm font-semibold text-white bg-gray-800 px-2 py-0.5 rounded">
                    {c.total}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhuma campanha com dados</p>
          )}
        </div>

        {/* Top Anúncios */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Top 5 Anúncios</h3>
          {stats.top_anuncios.length > 0 ? (
            <div className="space-y-2">
              {stats.top_anuncios.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-300 truncate flex-1 mr-4">{a.anuncio}</span>
                  <span className="text-sm font-semibold text-white bg-gray-800 px-2 py-0.5 rounded">
                    {a.total}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhum anúncio com dados</p>
          )}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Leads Recentes</h3>
        {stats.recent_leads.length > 0 ? (
          <div className="space-y-2">
            {stats.recent_leads.map((lead) => (
              <Link
                key={lead.id}
                to={`/leads/${lead.id}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-300">
                      {(lead.nome ?? lead.telefone).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lead.nome ?? lead.telefone}</p>
                    <p className="text-xs text-gray-500">{formatRelative(lead.data_entrada)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <OrigemBadge origem={lead.origem} />
                  <StatusBadge status={lead.status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Nenhum lead ainda</p>
        )}
      </div>
    </div>
  );
}
