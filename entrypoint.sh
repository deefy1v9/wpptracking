#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
echo "[entrypoint] Waiting for database..."
until node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
pool.query('SELECT 1').then(() => { pool.end(); process.exit(0); }).catch(() => { pool.end(); process.exit(1); });
" 2>/dev/null; do
  echo "[entrypoint] Database not ready, retrying in 2s..."
  sleep 2
done
echo "[entrypoint] Database is ready."

# Run Drizzle migrations
# CWD must be /app/backend so that './drizzle' resolves correctly
cd /app/backend
echo "[entrypoint] Applying database migrations..."
node dist/db/migrate.js
echo "[entrypoint] Migrations applied."

# Start the Express server
echo "[entrypoint] Starting server..."
exec node dist/index.js
