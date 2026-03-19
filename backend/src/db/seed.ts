import 'dotenv/config';
import { db } from './index';
import { settings } from './schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function main() {
  const existing = await db.query.settings.findFirst({ where: eq(settings.id, 1) });

  if (!existing) {
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await db.insert(settings).values({
      id: 1,
      verify_token: verifyToken,
      attribution_model: 'ultimo_clique',
    });
    console.log('Settings iniciais criadas.');
    console.log('Verify Token:', verifyToken);
  } else {
    console.log('Settings já existem, nenhuma alteração necessária.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro no seed:', err);
    process.exit(1);
  });
