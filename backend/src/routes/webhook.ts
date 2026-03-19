import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db/index';
import { connections, webhook_logs } from '../db/schema';
import { eq } from 'drizzle-orm';
import { parseWhatsAppCloud } from '../parsers/whatsapp-cloud';
import { parseEvolution } from '../parsers/evolution';
import { parseCloudia } from '../parsers/cloudia';
import { processIncomingMessage, updateLeadStatus, findLeadByPhone } from '../services/lead';

const router = Router();

// ─── Helper: resolve connection by ID ────────────────────────────────────────

async function getConnection(connectionId: number) {
  return db.query.connections.findFirst({ where: eq(connections.id, connectionId) });
}

// ─── WhatsApp Cloud webhook (per-connection) ──────────────────────────────────
// URL: /webhook/whatsapp/:connectionId
//   - with no connectionId: legacy single-tenant (reads first connection or env)

router.get('/whatsapp/:connectionId?', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode !== 'subscribe') {
    res.status(400).send('Bad Request');
    return;
  }

  let verifyToken: string | null = null;

  const connIdParam = (req.params as Record<string, string | undefined>)['connectionId'];
  if (connIdParam) {
    const connId = parseInt(connIdParam, 10);
    const conn = await getConnection(connId);
    verifyToken = conn?.verify_token ?? null;
  } else {
    // Legacy fallback: use env var
    verifyToken = process.env.VERIFY_TOKEN ?? null;
  }

  if (!verifyToken || token !== verifyToken) {
    res.status(403).send('Forbidden');
    return;
  }

  res.status(200).send(challenge);
});

router.post('/whatsapp/:connectionId?', async (req, res) => {
  try {
    const rawBody = req.body as Buffer;
    const connIdParam = (req.params as Record<string, string | undefined>)['connectionId'];

    let tenantId: number | null = null;
    let appSecret: string | null = null;

    if (connIdParam) {
      const connId = parseInt(connIdParam, 10);
      const conn = await getConnection(connId);
      if (conn) {
        tenantId = conn.tenant_id ?? null;
        appSecret = conn.app_secret ?? null;
      }
    } else {
      // Legacy fallback: env APP_SECRET
      appSecret = process.env.APP_SECRET ?? null;
    }

    // Validate HMAC signature if secret configured
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    if (appSecret && signature) {
      const expected = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex');

      if (
        signature.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      ) {
        res.status(401).send('Invalid signature');
        return;
      }
    }

    const payload = JSON.parse(rawBody.toString());
    const parsed = parseWhatsAppCloud(payload);

    if (parsed && tenantId !== null) {
      setImmediate(() => processIncomingMessage(parsed, tenantId!));
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[webhook/whatsapp] error:', err);
    res.status(200).json({ status: 'ok' });
  }
});

// ─── Evolution webhook ────────────────────────────────────────────────────────

router.post('/evolution', async (req, res) => {
  try {
    const parsed = parseEvolution(req.body);
    if (parsed) {
      // Evolution doesn't have connection-based routing yet
      // Log and skip processing if no tenant context
      console.warn('[webhook/evolution] received but no tenant routing implemented');
    }
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[webhook/evolution] error:', err);
    res.status(200).json({ status: 'ok' });
  }
});

// ─── Cloudia webhook ──────────────────────────────────────────────────────────

router.post('/cloudia', async (req, res) => {
  try {
    const parsed = parseCloudia(req.body);
    if (!parsed) {
      res.status(200).json({ status: 'ok' });
      return;
    }

    // Cloudia doesn't have connection-based routing yet — log and skip
    console.warn('[webhook/cloudia] received but no tenant routing implemented');
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[webhook/cloudia] error:', err);
    res.status(200).json({ status: 'ok' });
  }
});

export { router as webhookRouter };
