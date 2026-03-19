import cron from 'node-cron';
import { db } from '../db/index';
import { leads } from '../db/schema';
import { and, lt, eq, or } from 'drizzle-orm';
import { sendLeadSubmitted, sendQualifiedLead } from './meta-capi';

export function startCapiRetryScheduler(): void {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const pendingLeads = await db.query.leads.findMany({
        where: and(
          lt(leads.capi_retry_count, 3),
          or(
            eq(leads.lead_submitted_sent, false),
            and(
              eq(leads.qualified_lead_sent, false),
              eq(leads.status, 'qualificado')
            )
          )
        ),
      });

      for (const lead of pendingLeads) {
        if (!lead.tenant_id) continue; // skip legacy rows without tenant

        if (!lead.lead_submitted_sent) {
          await sendLeadSubmitted(lead, lead.tenant_id).catch((err) =>
            console.error('[capi-scheduler] sendLeadSubmitted error:', err)
          );
        }

        if (
          (lead.status === 'qualificado' || lead.status === 'ganho') &&
          !lead.qualified_lead_sent
        ) {
          await sendQualifiedLead(lead, lead.tenant_id).catch((err) =>
            console.error('[capi-scheduler] sendQualifiedLead error:', err)
          );
        }

        await db
          .update(leads)
          .set({ capi_retry_count: (lead.capi_retry_count ?? 0) + 1 })
          .where(eq(leads.id, lead.id));
      }

      if (pendingLeads.length > 0) {
        console.log(`[capi-scheduler] Processados ${pendingLeads.length} leads pendentes.`);
      }
    } catch (err) {
      console.error('[capi-scheduler] Erro no scheduler:', err);
    }
  });

  console.log('[capi-scheduler] Scheduler de CAPI iniciado (a cada 5 minutos).');
}
