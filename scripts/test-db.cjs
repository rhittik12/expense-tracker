require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('No DATABASE_URL'); process.exit(1); }
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const r = await client.query('select current_user, current_database()');
    console.log('DB OK:', r.rows[0]);
  } catch (e) {
    console.error('DB ERROR:', e);
  } finally {
    await client.end();
  }
}
main();
