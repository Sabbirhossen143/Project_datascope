
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing");
  }

  console.log("Connecting to Neon PostgreSQL...");

  const sql = neon(connectionString);

  const result = await sql`
    SELECT
      current_database() AS database,
      NOW() AS server_time,
      version() AS postgres_version
  `;

  console.log("SUCCESS: Neon PostgreSQL connected!");
  console.log("Database:", result[0].database);
  console.log("Server Time:", result[0].server_time);
  console.log("PostgreSQL:", result[0].postgres_version);
}

main().catch((error) => {
  console.error("DATABASE CONNECTION FAILED:");
  console.error(error);
  process.exitCode = 1;
});
