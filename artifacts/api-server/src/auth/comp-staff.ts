import { and, eq, isNull } from "drizzle-orm";
import { compDelegatesTable, db } from "@workspace/db";

/** Administrator, or the single active comp delegate. */
export async function isCompStaff(user: { id: number; role: string }): Promise<boolean> {
  if (user.role === "admin") return true;
  const [delegate] = await db
    .select({ id: compDelegatesTable.id })
    .from(compDelegatesTable)
    .where(and(eq(compDelegatesTable.userId, user.id), isNull(compDelegatesTable.revokedAt)));
  return Boolean(delegate);
}
