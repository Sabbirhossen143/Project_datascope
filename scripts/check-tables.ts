import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log("\nDATABASE TABLES:");

  tables.forEach((table) => {
    console.log("✓", table.table_name);
  });

  console.log("\nTotal tables:", tables.length);

  if (tables.length < 7) {
    throw new Error("Expected 7 tables. Please verify migration.");
  }

  console.log("SUCCESS: All 7 tables verified!");
}

main().catch((error) => {
  console.error("Verification failed:", error);
  process.exitCode = 1;
});
