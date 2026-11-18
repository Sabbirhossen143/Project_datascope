import { config } from "dotenv";
import { Pool } from "pg";

config({ path: ".env.local" });

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL_UNPOOLED,
  });

  try {
    console.log("Creating DataScope performance indexes...");

    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS records_search_trgm_idx
      ON dataset_records
      USING GIN (searchable_text gin_trgm_ops);
    `);

    console.log("SUCCESS: Text search index created.");

    await pool.query(`
      CREATE INDEX IF NOT EXISTS records_data_gin_idx
      ON dataset_records
      USING GIN (data jsonb_path_ops);
    `);

    console.log("SUCCESS: JSONB filtering index created.");

    await pool.query(`
      ANALYZE dataset_records;
    `);

    console.log("SUCCESS: Database statistics updated.");
    console.log("All indexing operations completed!");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Indexing failed:", error);
  process.exitCode = 1;
});
