export type { ParsedMessage, ParsedCloudiaEvent } from './parsed-message';

export interface Stats {
  leads_hoje: number;
  leads_semana: number;
  leads_mes: number;
  total: number;
  taxa_conversao: number;
  by_status: Record<string, number>;
  by_origem: Record<string, number>;
  top_campanhas: Array<{ campanha: string; total: number }>;
  top_anuncios: Array<{ anuncio: string; total: number }>;
  recent_leads: RecentLead[];
}

export interface RecentLead {
  id: number;
  nome: string | null;
  telefone: string;
  status: string;
  origem: string;
  data_entrada: string;
}

export interface WebhookUrls {
  whatsapp: string;
  evolution: string;
  cloudia: string;
}

export interface LeadFilters {
  status?: string;
  origem?: string;
  search?: string;
  campanha?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}
