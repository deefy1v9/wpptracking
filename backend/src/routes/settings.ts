import { Router } from 'express';
import { db } from '../db/index';
import { settings } from '../db/schema';
import type { NewSettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { invalidateSettingsCache } from '../services/settings-cache';
import type { Request } from 'express';

const router = Router();

function maskToken(token: string | null | undefined): string {
  if (!token || token.length <= 4) return '****';
  return '****' + token.slice(-4);
}

router.get('/webhook-urls', requireAuth, (req: Request, res) => {
  const protocol = req.headers['x-forwarded-proto'] ?? req.protocol;
  const host = req.headers['x-forwarded-host'] ?? req.get('host');
  const base = `${protocol}://${host}`;
  const { tenantId } = (req as unknown as AuthRequest).user;

  res.json({
    whatsapp: `${base}/webhook/whatsapp`,
    evolution: `${base}/webhook/evolution`,
    cloudia: `${base}/webhook/cloudia/${tenantId}`,
  });
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { tenantId } = (req as unknown as AuthRequest).user;
    const row = await db.query.settings.findFirst({ where: eq(settings.tenant_id, tenantId) });
    if (!row) {
      res.json({});
      return;
    }

    res.json({
      ...row,
      meta_access_token: maskToken(row.meta_access_token),
      evolution_api_key: maskToken(row.evolution_api_key),
      cloudia_webhook_secret: maskToken(row.cloudia_webhook_secret),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { tenantId } = (req as unknown as AuthRequest).user;
    const body = req.body as Record<string, string>;

    const current = await db.query.settings.findFirst({ where: eq(settings.tenant_id, tenantId) });

    const updateData: Partial<NewSettings> = {};
    const sensitiveFields = ['meta_access_token', 'evolution_api_key', 'cloudia_webhook_secret'] as const;

    const allowedFields = [
      'meta_access_token',
      'meta_pixel_id',
      'meta_page_id',
      'meta_ad_account_id',
      'cloudia_webhook_secret',
      'evolution_api_url',
      'evolution_api_key',
      'verify_token',
      'attribution_model',
    ] as const;

    for (const field of allowedFields) {
      if (field in body) {
        const value = body[field];
        if ((sensitiveFields as readonly string[]).includes(field) && value.startsWith('****')) {
          continue;
        }
        if (field === 'attribution_model') {
          if (value === 'primeiro_clique' || value === 'ultimo_clique') {
            updateData.attribution_model = value;
          }
        } else {
          (updateData as Record<string, string | null>)[field] = value || null;
        }
      }
    }

    if (current) {
      await db.update(settings).set({ ...updateData, updated_at: new Date() }).where(eq(settings.tenant_id, tenantId));
    } else {
      await db.insert(settings).values({ tenant_id: tenantId, ...updateData });
    }

    invalidateSettingsCache(tenantId);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/settings/test-meta — test the stored Meta credentials server-side
router.post('/test-meta', requireAuth, async (req, res, next) => {
  try {
    const { tenantId } = (req as unknown as AuthRequest).user;
    const row = await db.query.settings.findFirst({ where: eq(settings.tenant_id, tenantId) });
    if (!row?.meta_access_token || !row?.meta_pixel_id) {
      res.status(400).json({ ok: false, error: 'Token ou Pixel ID não configurados.' });
      return;
    }
    const metaRes = await fetch(
      `https://graph.facebook.com/v22.0/${row.meta_pixel_id}?access_token=${row.meta_access_token}`
    );
    if (metaRes.ok) {
      const data = await metaRes.json() as { id?: string; name?: string };
      res.json({ ok: true, pixelId: data.id, name: data.name });
    } else {
      const err = await metaRes.text();
      res.json({ ok: false, error: err });
    }
  } catch (err) {
    next(err);
  }
});

export { router as settingsRouter };
