import { db, moderationEventsTable } from "@workspace/db";

export async function writeAudit(
  actorUserId: number,
  action: string,
  targetType: string,
  targetId: string | number,
  reason?: string | null,
): Promise<void> {
  const trimmed = reason?.trim();
  await db.insert(moderationEventsTable).values({
    actorUserId,
    action,
    targetType,
    targetId: String(targetId),
    reason: trimmed ? trimmed.slice(0, 500) : null,
  });
}
