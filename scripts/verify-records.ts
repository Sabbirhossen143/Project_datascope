import { count, eq } from "drizzle-orm";
import { db } from "../src/db";
import { datasetRecords } from "../src/db/schema";

async function main() {
  const result = await db
    .select({ total: count() })
    .from(datasetRecords)
    .where(
      eq(
        datasetRecords.datasetId,
        "81f7f864-4784-4117-80c3-2401f923e78e"
      )
    );

  const total = Number(result[0].total);

  console.log("Database Record Verification");
  console.log("Total records:", total.toLocaleString());

  if (total !== 100000) {
    throw new Error(`Expected 100000 records, found ${total}`);
  }

  console.log("SUCCESS: All 100,000 records verified!");
}

main().catch((error) => {
  console.error("Verification failed:", error);
  process.exitCode = 1;
});
