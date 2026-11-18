import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import { accessPermissions, users } from "../src/db/schema";

const DATASET_ID = "81f7f864-4784-4117-80c3-2401f923e78e";

const assignments = [
  {
    email: "analyst@datascope.com",
    canRead: true,
    canExport: true,
  },
  {
    email: "viewer@datascope.com",
    canRead: true,
    canExport: false,
  },
];

async function assignPermissions() {
  for (const assignment of assignments) {
    const [user] = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.email, assignment.email))
      .limit(1);

    if (!user) {
      throw new Error(`User not found: ${assignment.email}`);
    }

    if (
      assignment.email === "analyst@datascope.com" &&
      user.role !== "ANALYST"
    ) {
      throw new Error("Analyst account does not have ANALYST role.");
    }

    if (
      assignment.email === "viewer@datascope.com" &&
      user.role !== "VIEWER"
    ) {
      throw new Error("Viewer account does not have VIEWER role.");
    }

    const existing = await db
      .select({ id: accessPermissions.id })
      .from(accessPermissions)
      .where(
        and(
          eq(accessPermissions.userId, user.id),
          eq(accessPermissions.datasetId, DATASET_ID)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(accessPermissions)
        .set({
          canRead: assignment.canRead,
          canExport: assignment.canExport,
        })
        .where(
          and(
            eq(accessPermissions.userId, user.id),
            eq(accessPermissions.datasetId, DATASET_ID)
          )
        );
    } else {
      await db.insert(accessPermissions).values({
        userId: user.id,
        datasetId: DATASET_ID,
        canRead: assignment.canRead,
        canExport: assignment.canExport,
      });
    }

    console.log(`${user.email} permission assigned:`);
    console.table({
      role: user.role,
      canRead: assignment.canRead,
      canExport: assignment.canExport,
    });
  }
}

assignPermissions().catch((error) => {
  console.error("Permission assignment failed:", error);
  process.exitCode = 1;
});
