import { Router } from 'express';
import { db } from '../db/index';
import { triggerPhrases } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { invalidateTriggerCache } from '../services/trigger-cache';
import { z } from 'zod';

const router = Router();
router.use(requireAuth);

// GET /api/trigger-phrases
router.get('/', async (req, res, next) => {
  try {
    const { tenantId } = (req as unknown as AuthRequest).user;
    const rows = await db.query.triggerPhrases.findMany({
      where: eq(triggerPhrases.tenant_id, tenantId),
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  status: z.enum(['novo', 'em_atendimento', 'qualificado', 'ganho', 'perdido']),
  phrase: z.string().min(1).max(500),
});

// POST /api/trigger-phrases
router.post('/', async (req, res, next) => {
  try {
    const { tenantId } = (req as unknown as AuthRequest).user;
    const result = createSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ error: 'Dados inválidos', details: result.error.issues });
      return;
    }

    const [inserted] = await db
      .insert(triggerPhrases)
      .values({ tenant_id: tenantId, status: result.data.status, phrase: result.data.phrase })
      .returning();

    invalidateTriggerCache(tenantId);
    res.status(201).json(inserted);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/trigger-phrases/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { tenantId } = (req as unknown as AuthRequest).user;
    const id = parseInt(req.params.id, 10);

    const deleted = await db
      .delete(triggerPhrases)
      .where(and(eq(triggerPhrases.id, id), eq(triggerPhrases.tenant_id, tenantId)))
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({ error: 'Gatilho não encontrado' });
      return;
    }

    invalidateTriggerCache(tenantId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export { router as triggerPhrasesRouter };
