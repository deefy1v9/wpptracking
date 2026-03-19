import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/index';
import { tenants, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { AuthPayload } from '../middleware/auth';

const router = Router();

function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET ?? 'secret', { expiresIn: '7d' });
}

// POST /api/auth/register
const registerSchema = z.object({
  companyName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

router.post('/register', async (req, res, next) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Dados inválidos', details: result.error.issues });
      return;
    }

    const { companyName, email, password, name } = result.data;

    // Check email uniqueness
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      res.status(409).json({ error: 'E-mail já cadastrado' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create tenant + user atomically
    const [tenant] = await db.insert(tenants).values({ name: companyName }).returning();
    const [user] = await db
      .insert(users)
      .values({ tenant_id: tenant.id, email, password_hash: passwordHash, name: name ?? null })
      .returning();

    const token = signToken({ sub: user.id, tenantId: tenant.id, email: user.email });

    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/login', async (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Dados inválidos' });
      return;
    }

    const { email, password } = result.data;

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const token = signToken({ sub: user.id, tenantId: user.tenant_id, email: user.email });

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req, res) => {
  res.json({ ok: true });
});

export { router as authRouter };
