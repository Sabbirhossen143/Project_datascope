import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";

async function updateRole() {
  const email = process.argv[2]?.trim().toLowerCase();
  const role = process.argv[3]?.toUpperCase() as
  | "ADMIN"
  | "ANALYST"
  | "VIEWER";

  if (!email || !["ADMIN", "ANALYST", "VIEWER"].includes(role)) {
    throw new Error("Usage: npx tsx scripts/set-user-role.ts <email> <ADMIN|ANALYST|VIEWER>");
  }

  const [user] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.email, email))
    .returning({
      name: users.name,
      email: users.email,
      role: users.role,
    });

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  console.log("User role updated successfully:");
  console.table(user);
}

updateRole().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
