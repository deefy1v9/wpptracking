import { Router } from 'express';
import { db } from '../db/index';
import { leads } from '../db/schema';
import { count, eq, gte, and, sql, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { tenantId } = (req as unknown as AuthRequest).user;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const byTenant = eq(leads.tenant_id, tenantId);

    const [
      total_result,
      hoje_result,
      semana_result,
      mes_result,
      ganho_result,
      by_status_result,
      by_origem_result,
      top_campanhas_result,
      top_anuncios_result,
      recent_leads_result,
    ] = await Promise.all([
      db.select({ count: count() }).from(leads).where(byTenant),
      db.select({ count: count() }).from(leads).where(and(byTenant, gte(leads.data_entrada, startOfToday))),
      db.select({ count: count() }).from(leads).where(and(byTenant, gte(leads.data_entrada, startOfWeek))),
      db.select({ count: count() }).from(leads).where(and(byTenant, gte(leads.data_entrada, startOfMonth))),
      db.select({ count: count() }).from(leads).where(and(byTenant, eq(leads.status, 'ganho'))),
      db.select({ status: leads.status, count: count() }).from(leads).where(byTenant).groupBy(leads.status),
      db.select({ origem: leads.origem, count: count() }).from(leads).where(byTenant).groupBy(leads.origem),
      db
        .select({ campanha: leads.campanha, total: count() })
        .from(leads)
        .where(and(byTenant, sql`${leads.campanha} IS NOT NULL`))
        .groupBy(leads.campanha)
        .orderBy(desc(count()))
        .limit(5),
      db
        .select({ anuncio: leads.anuncio, total: count() })
        .from(leads)
        .where(and(byTenant, sql`${leads.anuncio} IS NOT NULL`))
        .groupBy(leads.anuncio)
        .orderBy(desc(count()))
        .limit(5),
      db.query.leads.findMany({
        where: byTenant,
        orderBy: [desc(leads.data_entrada)],
        limit: 10,
        columns: {
          id: true,
          nome: true,
          telefone: true,
          status: true,
          origem: true,
          data_entrada: true,
        },
      }),
    ]);

    const total = total_result[0]?.count ?? 0;
    const ganho = ganho_result[0]?.count ?? 0;
    const taxa_conversao = total > 0 ? Math.round((ganho / total) * 100 * 10) / 10 : 0;

    const by_status: Record<string, number> = {};
    for (const row of by_status_result) {
      if (row.status) by_status[row.status] = row.count;
    }

    const by_origem: Record<string, number> = {};
    for (const row of by_origem_result) {
      if (row.origem) by_origem[row.origem] = row.count;
    }

    res.json({
      leads_hoje: hoje_result[0]?.count ?? 0,
      leads_semana: semana_result[0]?.count ?? 0,
      leads_mes: mes_result[0]?.count ?? 0,
      total,
      taxa_conversao,
      by_status,
      by_origem,
      top_campanhas: top_campanhas_result.map((r) => ({
        campanha: r.campanha ?? 'Desconhecida',
        total: r.total,
      })),
      top_anuncios: top_anuncios_result.map((r) => ({
        anuncio: r.anuncio ?? 'Desconhecido',
        total: r.total,
      })),
      recent_leads: recent_leads_result,
    });
  } catch (err) {
    next(err);
  }
});

export { router as statsRouter };
