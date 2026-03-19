import { Router } from 'express';
import { db } from '../db/index';
import { webhook_logs } from '../db/schema';
import { eq, desc, count, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { tenantId } = (req as unknown as AuthRequest).user;
    const { source, processed } = req.query as Record<string, string>;
    const page = parseInt((req.query.page as string) ?? '1', 10);
    const limit = Math.min(parseInt((req.query.limit as string) ?? '50', 10), 100);
    const offset = (page - 1) * limit;

    const conditions = [eq(webhook_logs.tenant_id, tenantId)];
    if (source) conditions.push(eq(webhook_logs.source, source as 'whatsapp_cloud' | 'evolution' | 'cloudia'));
    if (processed !== undefined) {
      conditions.push(eq(webhook_logs.processed, processed === 'true'));
    }

    const where = and(...conditions);

    const [rows, totalResult] = await Promise.all([
      db.query.webhook_logs.findMany({
        where,
        orderBy: [desc(webhook_logs.created_at)],
        limit,
        offset,
      }),
      db.select({ count: count() }).from(webhook_logs).where(where),
    ]);

    res.json({
      logs: rows,
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

export { router as logsRouter };
