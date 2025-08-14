import { Client } from 'pg';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL missing');
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query('select version() as v, current_database() as db, current_user as user');
    console.log('Connected OK:', res.rows[0]);
  } catch (e) {
    console.error('Connection failed:', e);
  } finally {
    await client.end();
  }
}
main();
