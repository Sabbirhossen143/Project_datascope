import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { db } from "../index";
import { datasets, datasetRecords } from "../schema";

config({ path: ".env.local" });

const TOTAL_RECORDS = 100_000;
const BATCH_SIZE = 500;
const DATASET_SLUG = "customer-transactions-100k";

const names = [
  "Sabbir Hossain", "Rahim Ahmed", "Karim Uddin",
  "Nusrat Jahan", "Fatema Akter", "Tanvir Hasan",
  "Mehedi Hasan", "Sadia Islam", "Imran Hossain",
  "Mim Akter",
];

const products = [
  "Laptop", "Smartphone", "Headphones", "Keyboard",
  "Monitor", "Mouse", "Tablet", "Smart Watch",
];

const categories = [
  "Electronics", "Accessories", "Computers", "Mobile",
];

const regions = [
  "Dhaka", "Chattogram", "Sylhet", "Rajshahi",
  "Khulna", "Barishal", "Rangpur", "Mymensingh",
];

const statuses = ["Completed", "Pending", "Cancelled"];
const payments = ["Cash", "Card", "Mobile Banking"];

function generateRecord(index: number) {
  const name = names[index % names.length];
  const product = products[index % products.length];
  const category = categories[index % categories.length];
  const region = regions[index % regions.length];
  const status = statuses[index % statuses.length];
  const payment = payments[index % payments.length];

  const amount = 500 + ((index * 137) % 49_500);
  const quantity = (index % 5) + 1;

  const orderDate = new Date(
    Date.UTC(2024, 0, 1) + index * 60 * 60 * 1000
  ).toISOString();

  const data = {
    transactionId: `TRX-${String(index + 1).padStart(7, "0")}`,
    customerName: name,
    email: `customer${index + 1}@example.com`,
    product,
    category,
    amount,
    quantity,
    status,
    region,
    paymentMethod: payment,
    orderDate,
  };

  const searchableText = Object.values(data)
    .join(" ")
    .toLowerCase();

  return {
    externalId: data.transactionId,
    data,
    searchableText,
  };
}

async function main() {
  console.log("Starting DataScope data generation...");
  console.log(`Target records: ${TOTAL_RECORDS.toLocaleString()}`);

  // Remove previous sample dataset if this script is rerun.
  await db
    .delete(datasets)
    .where(eq(datasets.slug, DATASET_SLUG));

  // Create dataset.
  const [dataset] = await db
    .insert(datasets)
    .values({
      name: "Customer Transactions Dataset",
      slug: DATASET_SLUG,
      description:
        "100,000 sample customer transaction records for DataScope.",
      category: "Business",
      dataSource: "Generated Sample Data",
      totalRecords: TOTAL_RECORDS,
    })
    .returning({ id: datasets.id });

  console.log("Dataset created:", dataset.id);

  // Insert records in batches.
  for (let start = 0; start < TOTAL_RECORDS; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE, TOTAL_RECORDS);

    const batch = Array.from(
      { length: end - start },
      (_, index) => generateRecord(start + index)
    );

    await db.insert(datasetRecords).values(
      batch.map((record) => ({
        datasetId: dataset.id,
        ...record,
      }))
    );

    console.log(
      `Inserted ${end.toLocaleString()} / ${TOTAL_RECORDS.toLocaleString()} records`
    );
  }

  console.log("\nSUCCESS: Data generation completed!");
  console.log("Dataset ID:", dataset.id);
  console.log("Total records:", TOTAL_RECORDS);
}

main().catch((error) => {
  console.error("Data generation failed:", error);
  process.exitCode = 1;
});
