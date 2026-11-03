const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

function readEnvFile() {
  const values = {};
  const file = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(file)) return values;

  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith('#')) continue;
    values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return values;
}

async function main() {
  const fileEnv = readEnvFile();
  const connectionString =
    process.env.DATABASE_URL ||
    (process.env.DB_DATABASE?.startsWith('postgres')
      ? process.env.DB_DATABASE
      : undefined) ||
    fileEnv.DATABASE_URL ||
    (fileEnv.DB_DATABASE?.startsWith('postgres') ? fileEnv.DB_DATABASE : undefined);

  if (!connectionString) {
    throw new Error(
      'Set DATABASE_URL, or put the PostgreSQL URL in DB_DATABASE in .env.',
    );
  }

  const remoteTls = /\.(render|supabase)\.co(m)?(?:[:/?]|$)/i.test(
    new URL(connectionString).hostname,
  );
  const client = new Client({
    connectionString,
    ssl: remoteTls ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
  });

  try {
    await client.connect();
    const before = await client.query(
      'SELECT (SELECT COUNT(*) FROM products) AS products, (SELECT COUNT(*) FROM categories) AS categories',
    );
    console.log(
      `Before seed: ${before.rows[0].products} products, ${before.rows[0].categories} categories`,
    );

    const sql = fs.readFileSync(
      path.resolve(process.cwd(), 'scripts/seed-drink-catalog.sql'),
      'utf8',
    );
    await client.query(sql);

    const after = await client.query(
      'SELECT (SELECT COUNT(*) FROM products WHERE "isActive" = TRUE) AS products, (SELECT COUNT(*) FROM categories WHERE "isActive" = TRUE) AS categories',
    );
    console.log(
      `Seed complete: ${after.rows[0].products} active products, ${after.rows[0].categories} active categories`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Catalog seed failed: ${error.code || error.name}: ${error.message}`);
  process.exitCode = 1;
});
