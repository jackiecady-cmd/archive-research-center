import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { hashPassword } from "./passwords.js";
import { usersTable } from "./schema/users.js";

/** System owner for seeded research and forum rows. The password is random and discarded. */
export const SEED_USER_EMAIL = "seed@archive.local";
export const SEED_USER_DISPLAY_NAME = "Archive Seed";

export async function ensureSeedUser() {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, SEED_USER_EMAIL));
  if (existing) return existing;

  const passwordHash = await hashPassword(randomBytes(32).toString("base64url"));
  const [created] = await db
    .insert(usersTable)
    .values({
      email: SEED_USER_EMAIL,
      passwordHash,
      displayName: SEED_USER_DISPLAY_NAME,
      role: "user",
    })
    .returning();
  return created;
}
