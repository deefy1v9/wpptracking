import { db } from '../db/index';
import { settings } from '../db/schema';
import type { Settings } from '../db/schema';
import { eq } from 'drizzle-orm';

const CACHE_TTL_MS = 60_000; // 60 seconds

interface CacheEntry {
  settings: Settings;
  fetchedAt: number;
}

const cache = new Map<number, CacheEntry>();

export async function getSettings(tenantId: number): Promise<Settings | null> {
  const now = Date.now();
  const entry = cache.get(tenantId);
  if (entry && now - entry.fetchedAt < CACHE_TTL_MS) {
    return entry.settings;
  }

  const row = await db.query.settings.findFirst({ where: eq(settings.tenant_id, tenantId) });
  if (!row) return null;

  cache.set(tenantId, { settings: row, fetchedAt: now });
  return row;
}

export function invalidateSettingsCache(tenantId: number): void {
  cache.delete(tenantId);
}
