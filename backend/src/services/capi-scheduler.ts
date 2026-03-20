import cron from 'node-cron';
import { db } from '../db/index';
import { leads } from '../db/schema';
import { and, lt, eq, or, isNotNull } from 'drizzle-orm';
import { sendLeadSubmitted, sendQualifiedLead } from './meta-capi';

export function startCapiRetryScheduler(): void {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const pendingLeads = await db.query.leads.findMany({
        where: and(
          isNotNull(leads.ctwaclid),   // CAPI requires ctwaclid; skip organic leads entirely
          lt(leads.capi_retry_count, 5), // stop after 5 real API failures
          or(
            eq(leads.lead_submitted_sent, false),
            and(
              eq(leads.qualified_lead_sent, false),
              or(eq(leads.status, 'qualificado'), eq(leads.status, 'ganho'))
            )
          )
        ),
      });

      let sent = 0;
      let failed = 0;

      for (const lead of pendingLeads) {
        if (!lead.tenant_id) continue;

        let apiFailed = false;

        if (!lead.lead_submitted_sent) {
          const result = await sendLeadSubmitted(lead, lead.tenant_id).catch((err) => {
            console.error('[capi-scheduler] sendLeadSubmitted error:', err);
            return 'failed' as const;
          });
          if (result === 'sent') sent++;
          if (result === 'failed') apiFailed = true;
        }

        if (
          (lead.status === 'qualificado' || lead.status === 'ganho') &&
          !lead.qualified_lead_sent
        ) {
          const result = await sendQualifiedLead(lead, lead.tenant_id).catch((err) => {
            console.error('[capi-scheduler] sendQualifiedLead error:', err);
            return 'failed' as const;
          });
          if (result === 'sent') sent++;
          if (result === 'failed') apiFailed = true;
        }

        // Only increment retry count on real API failures — not on 'skipped' (settings missing)
        if (apiFailed) {
          failed++;
          await db
            .update(leads)
            .set({ capi_retry_count: (lead.capi_retry_count ?? 0) + 1 })
            .where(eq(leads.id, lead.id));
        }
      }

      if (pendingLeads.length > 0) {
        console.log(`[capi-scheduler] ${pendingLeads.length} leads verificados — ${sent} enviados, ${failed} falhas de API.`);
      }
    } catch (err) {
      console.error('[capi-scheduler] Erro no scheduler:', err);
    }
  });

  console.log('[capi-scheduler] Scheduler de CAPI iniciado (a cada 5 minutos).');
}
