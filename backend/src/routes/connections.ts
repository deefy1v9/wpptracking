import { Router } from 'express';
import { db } from '../db/index';
import { connections } from '../db/schema';
import type { NewConnection } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

function maskToken(token: string | null | undefined): string {
  if (!token || token.length <= 4) return '****';
  return '****' + token.slice(-4);
}

function maskRow(row: typeof connections.$inferSelect) {
  return {
    ...row,
    meta_access_token: maskToken(row.meta_access_token),
    evolution_api_key: maskToken(row.evolution_api_key),
    app_secret: maskToken(row.app_secret),
  };
}

// GET /api/connections
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { tenantId } = (req as unknown as AuthRequest).user;
    const rows = await db.query.connections.findMany({
      where: eq(connections.tenant_id, tenantId),
      orderBy: (c, { asc }) => [asc(c.created_at)],
    });
    res.json(rows.map(maskRow));
  } catch (err) {
    next(err);
  }
});

// POST /api/connections
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { tenantId } = (req as unknown as AuthRequest).user;
    const body = req.body as Partial<NewConnection>;
    if (!body.name || typeof body.name !== 'string') {
      res.status(400).json({ error: 'name é obrigatório' });
      return;
    }
    const [created] = await db
      .insert(connections)
      .values({
        tenant_id: tenantId,
        name: body.name,
        is_active: body.is_active ?? true,
        is_paused: body.is_paused ?? false,
        meta_access_token: body.meta_access_token || null,
        meta_pixel_id: body.meta_pixel_id || null,
        meta_page_id: body.meta_page_id || null,
        meta_ad_account_id: body.meta_ad_account_id || null,
        evolution_api_url: body.evolution_api_url || null,
        evolution_api_key: body.evolution_api_key || null,
        verify_token: body.verify_token || null,
        app_secret: body.app_secret || null,
        attribution_model: body.attribution_model ?? 'ultimo_clique',
      })
      .returning();
    res.status(201).json(maskRow(created));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/connections/:id
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { tenantId } = (req as unknown as AuthRequest).user;
    const id = parseInt(req.params.id as string, 10);
    const body = req.body as Partial<NewConnection>;

    const current = await db.query.connections.findFirst({
      where: and(eq(connections.id, id), eq(connections.tenant_id, tenantId)),
    });
    if (!current) {
      res.status(404).json({ error: 'Conexão não encontrada' });
      return;
    }

    const sensitiveFields = ['meta_access_token', 'evolution_api_key', 'app_secret'] as const;
    const updateData: Partial<NewConnection> = { updated_at: new Date() };

    const textFields = [
      'name', 'meta_access_token', 'meta_pixel_id', 'meta_page_id',
      'meta_ad_account_id', 'evolution_api_url', 'evolution_api_key',
      'verify_token', 'app_secret',
    ] as const;

    for (const field of textFields) {
      if (field in body) {
        const value = body[field] as string | null | undefined;
        if ((sensitiveFields as readonly string[]).includes(field) && typeof value === 'string' && value.startsWith('****')) {
          continue;
        }
        (updateData as Record<string, unknown>)[field] = value || null;
      }
    }

    if ('is_active' in body) updateData.is_active = body.is_active;
    if ('is_paused' in body) updateData.is_paused = body.is_paused;
    if ('attribution_model' in body) {
      const m = body.attribution_model;
      if (m === 'primeiro_clique' || m === 'ultimo_clique') {
        updateData.attribution_model = m;
      }
    }

    const [updated] = await db
      .update(connections)
      .set(updateData)
      .where(and(eq(connections.id, id), eq(connections.tenant_id, tenantId)))
      .returning();

    res.json(maskRow(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/connections/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { tenantId } = (req as unknown as AuthRequest).user;
    const id = parseInt(req.params.id as string, 10);
    await db.delete(connections).where(and(eq(connections.id, id), eq(connections.tenant_id, tenantId)));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export { router as connectionsRouter };
