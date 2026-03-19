import type { ParsedMessage } from '../types/parsed-message';
import { normalizePhone } from '../services/hash';

interface EvolutionPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
      imageMessage?: { caption?: string };
      videoMessage?: { caption?: string };
      documentMessage?: { caption?: string; fileName?: string };
      audioMessage?: Record<string, unknown>;
      stickerMessage?: Record<string, unknown>;
    };
    contextInfo?: {
      externalAdReply?: {
        title?: string;
        body?: string;
        mediaType?: string;
        thumbnailUrl?: string;
        mediaUrl?: string;
        sourceType?: string;
        sourceId?: string;
        sourceUrl?: string;
        ctwaClid?: string;
        sourceApp?: string;
      };
    };
    messageTimestamp?: number;
  };
}

function detectTipo(message: EvolutionPayload['data']['message']): ParsedMessage['tipo'] {
  if (!message) return 'outros';
  if (message.conversation || message.extendedTextMessage) return 'texto';
  if (message.imageMessage) return 'imagem';
  if (message.videoMessage) return 'video';
  if (message.documentMessage) return 'documento';
  if (message.audioMessage) return 'audio';
  if (message.stickerMessage) return 'sticker';
  return 'outros';
}

function extractContent(message: EvolutionPayload['data']['message']): string | null {
  if (!message) return null;
  return (
    message.conversation ??
    message.extendedTextMessage?.text ??
    message.imageMessage?.caption ??
    message.videoMessage?.caption ??
    message.documentMessage?.caption ??
    null
  );
}

export function parseEvolution(payload: unknown): ParsedMessage | null {
  try {
    const data = payload as EvolutionPayload;

    if (data.event !== 'messages.upsert') return null;

    const key = data.data?.key;
    if (!key) return null;

    // Only process incoming messages
    if (key.fromMe) return null;

    const rawPhone = key.remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
    const phone = normalizePhone(rawPhone);
    if (!phone) return null;

    const adReply = data.data?.contextInfo?.externalAdReply;
    const veioDeAnuncio = !!adReply?.ctwaClid;

    const timestamp = data.data?.messageTimestamp
      ? new Date(data.data.messageTimestamp * 1000).toISOString()
      : new Date().toISOString();

    return {
      phone,
      name: data.data?.pushName ?? null,
      content: extractContent(data.data?.message),
      messageId: key.id,
      timestamp,
      direction: 'entrada',
      tipo: detectTipo(data.data?.message),
      ctwaclid: adReply?.ctwaClid ?? null,
      sourceId: adReply?.sourceId ?? null,
      sourceUrl: adReply?.sourceUrl ?? null,
      tituloAnuncio: adReply?.title ?? null,
      tipoMidia: adReply?.mediaType?.toLowerCase() ?? null,
      thumbnailUrl: adReply?.thumbnailUrl ?? null,
      veioDeAnuncio,
      source: 'evolution',
      rawPayload: payload,
    };
  } catch {
    return null;
  }
}
