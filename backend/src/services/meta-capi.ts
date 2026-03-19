import { db } from '../db/index';
import { leads } from '../db/schema';
import type { Lead } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getSettings } from './settings-cache';
import { hashPhone, hashName, splitName } from './hash';

const CAPI_BASE = 'https://graph.facebook.com/v22.0';

interface CapiUserData {
  ph?: string;
  fn?: string;
  ln?: string;
  ctwa_clid?: string;
  page_id?: string;
}

interface CapiEvent {
  action_source: string;
  event_name: string;
  event_time: number;
  messaging_channel: string;
  user_data: CapiUserData;
}

async function sendCapiEvent(
  pixelId: string,
  accessToken: string,
  event: CapiEvent
): Promise<boolean> {
  try {
    const res = await fetch(
      `${CAPI_BASE}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [event] }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error('[meta-capi] sendCapiEvent error:', err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[meta-capi] sendCapiEvent exception:', err);
    return false;
  }
}

function buildUserData(lead: Lead, pageId?: string | null): CapiUserData {
  const userData: CapiUserData = {
    ph: hashPhone(lead.telefone),
  };

  if (lead.nome) {
    const { firstName, lastName } = splitName(lead.nome);
    if (firstName) userData.fn = hashName(firstName);
    if (lastName) userData.ln = hashName(lastName);
  }

  if (lead.ctwaclid) userData.ctwa_clid = lead.ctwaclid;
  if (pageId) userData.page_id = pageId;

  return userData;
}

export async function sendLeadSubmitted(lead: Lead, tenantId: number): Promise<boolean> {
  if (lead.lead_submitted_sent) return true;
  if (!lead.ctwaclid) return false;

  const cfg = await getSettings(tenantId);
  if (!cfg?.meta_pixel_id || !cfg?.meta_access_token) return false;

  const event: CapiEvent = {
    action_source: 'business_messaging',
    event_name: 'LeadSubmitted',
    event_time: Math.floor(Date.now() / 1000),
    messaging_channel: 'whatsapp',
    user_data: buildUserData(lead, cfg.meta_page_id),
  };

  const ok = await sendCapiEvent(cfg.meta_pixel_id, cfg.meta_access_token, event);
  if (ok) {
    await db
      .update(leads)
      .set({ lead_submitted_sent: true })
      .where(eq(leads.id, lead.id));
  }
  return ok;
}

export async function sendQualifiedLead(lead: Lead, tenantId: number): Promise<boolean> {
  if (lead.qualified_lead_sent) return true;
  if (!lead.ctwaclid) return false;

  const cfg = await getSettings(tenantId);
  if (!cfg?.meta_pixel_id || !cfg?.meta_access_token) return false;

  const event: CapiEvent = {
    action_source: 'business_messaging',
    event_name: 'QualifiedLead',
    event_time: Math.floor(Date.now() / 1000),
    messaging_channel: 'whatsapp',
    user_data: buildUserData(lead, cfg.meta_page_id),
  };

  const ok = await sendCapiEvent(cfg.meta_pixel_id, cfg.meta_access_token, event);
  if (ok) {
    await db
      .update(leads)
      .set({ qualified_lead_sent: true })
      .where(eq(leads.id, lead.id));
  }
  return ok;
}
