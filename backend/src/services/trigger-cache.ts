import { db } from '../db/index';
import { triggerPhrases } from '../db/schema';
import type { TriggerPhrase } from '../db/schema';
import { eq } from 'drizzle-orm';

const CACHE_TTL_MS = 60_000; // 60 seconds

interface CacheEntry {
  phrases: TriggerPhrase[];
  fetchedAt: number;
}

const cache = new Map<number, CacheEntry>();

export async function getTriggerPhrases(tenantId: number): Promise<TriggerPhrase[]> {
  const now = Date.now();
  const entry = cache.get(tenantId);
  if (entry && now - entry.fetchedAt < CACHE_TTL_MS) {
    return entry.phrases;
  }

  const rows = await db.query.triggerPhrases.findMany({
    where: eq(triggerPhrases.tenant_id, tenantId),
  });

  cache.set(tenantId, { phrases: rows, fetchedAt: now });
  return rows;
}

export function invalidateTriggerCache(tenantId: number): void {
  cache.delete(tenantId);
}
