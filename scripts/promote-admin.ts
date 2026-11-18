import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";

async function promoteAdmin() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error("Please provide a registered user email.");
  }

  const [user] = await db
    .update(users)
    .set({
      role: "ADMIN",
      updatedAt: new Date(),
    })
    .where(eq(users.email, email))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  if (!user) {
    throw new Error(`No registered user found with email: ${email}`);
  }

  console.log("Admin role assigned successfully:");
  console.table(user);
}

promoteAdmin().catch((error) => {
  console.error("Admin promotion failed:", error);
  process.exitCode = 1;
});
