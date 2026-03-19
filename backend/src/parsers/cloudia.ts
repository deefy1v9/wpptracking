import type { ParsedCloudiaEvent } from '../types/parsed-message';
import { normalizePhone } from '../services/hash';

interface CloudiaPayload {
  event?: string;
  data?: {
    nome?: string;
    telefone?: string;
    email?: string;
    qualificado?: boolean;
    cidade?: string;
    procedimento?: string;
    data_agendamento?: string;
  };
  // Some Cloudia versions send flat structure
  nome?: string;
  telefone?: string;
  event_type?: string;
}

export function parseCloudia(payload: unknown): ParsedCloudiaEvent | null {
  try {
    const data = payload as CloudiaPayload;

    const rawPhone =
      data.data?.telefone ?? data.telefone ?? null;

    if (!rawPhone) return null;

    const phone = normalizePhone(rawPhone);
    if (!phone) return null;

    const name = data.data?.nome ?? data.nome ?? null;

    // Normalize event name
    const eventRaw = (data.event ?? data.event_type ?? '').toLowerCase();
    let event: ParsedCloudiaEvent['event'] = 'lead_won';
    if (eventRaw.includes('appointment') || eventRaw.includes('agendamento')) {
      event = 'appointment_scheduled';
    } else if (eventRaw.includes('contact') || eventRaw.includes('contato')) {
      event = 'contact_updated';
    }

    return { event, phone, name, rawPayload: payload };
  } catch {
    return null;
  }
}
