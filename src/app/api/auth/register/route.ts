import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users, datasets, accessPermissions } from "@/db/schema";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide valid registration details.",
          errors: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const name = validation.data.name;
    const email = validation.data.email.toLowerCase();
    const password = validation.data.password;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "Email is already registered." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role: "VIEWER",
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    // Give a newly registered Viewer read access to the default sample dataset.
    const defaultDatasetId = "81f7f864-4784-4117-80c3-2401f923e78e";
    const [defaultDataset] = await db
      .select({ id: datasets.id })
      .from(datasets)
      .where(eq(datasets.id, defaultDatasetId))
      .limit(1);

    if (defaultDataset) {
      await db.insert(accessPermissions).values({
        userId: user.id,
        datasetId: defaultDataset.id,
        canRead: true,
        canExport: false,
      });
    }

    // Registration does not create a login session.
    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully. Please sign in.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create account." },
      { status: 500 }
    );
  }
}
