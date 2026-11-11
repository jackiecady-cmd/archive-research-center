import { Router } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  compCodesTable,
  compDelegatesTable,
  compGrantsTable,
  compRedemptionsTable,
  db,
  usersTable,
} from "@workspace/db";
import { writeAudit } from "../auth/audit";
import { requireAdmin, requireUser } from "../auth/middleware";
import { hashOpaqueSecret, newOpaqueCode } from "../auth/secrets";
import { parseIntParam, sendValidationError } from "../lib/http";
import { compCodeCreateBody, delegateBody, redeemCodeBody } from "../validation/bodies";

const router = Router();

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current && typeof current === "object"; depth += 1) {
    if ("code" in current && (current as { code?: unknown }).code === "23505") return true;
    current = "cause" in current ? (current as { cause?: unknown }).cause : undefined;
  }
  return false;
}

async function issuerAllowed(userId: number, role: string): Promise<boolean> {
  if (role === "admin") return true;
  const [delegate] = await db
    .select({ id: compDelegatesTable.id })
    .from(compDelegatesTable)
    .where(and(eq(compDelegatesTable.userId, userId), isNull(compDelegatesTable.revokedAt)));
  return Boolean(delegate);
}

router.post("/comp-codes", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  if (!(await issuerAllowed(user.id, user.role))) {
    res.status(403).json({ error: "Only an administrator or the comp delegate can create codes" });
    return;
  }
  const parsed = compCodeCreateBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const minted = newOpaqueCode("comp");
  const [row] = await db.insert(compCodesTable).values({
    codeHash: minted.hash,
    codeHint: minted.hint,
    label: parsed.data.label ?? null,
    singleUse: parsed.data.singleUse ?? true,
    createdByUserId: user.id,
  }).returning();
  await writeAudit(user.id, "comp_code.create", "comp_code", row.id, parsed.data.label ?? null);
  res.status(201).json({
    id: row.id,
    code: minted.secret,
    hint: row.codeHint,
    label: row.label,
    singleUse: row.singleUse,
    createdAt: row.createdAt.toISOString(),
  });
});

router.get("/comp-codes", async (req, res): Promise<void> => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const [codes, redemptions] = await Promise.all([
    db.select().from(compCodesTable).orderBy(desc(compCodesTable.createdAt)),
    db.select({ codeId: compRedemptionsTable.codeId }).from(compRedemptionsTable).where(isNull(compRedemptionsTable.revokedAt)),
  ]);
  const counts = new Map<number, number>();
  for (const redemption of redemptions) {
    counts.set(redemption.codeId, (counts.get(redemption.codeId) ?? 0) + 1);
  }
  res.json(codes.map((row) => ({
    id: row.id,
    hint: row.codeHint,
    label: row.label,
    singleUse: row.singleUse,
    createdAt: row.createdAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
    redeemedCount: counts.get(row.id) ?? 0,
  })));
});

router.post("/comp-codes/redeem", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const parsed = redeemCodeBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const codeHash = hashOpaqueSecret("comp", parsed.data.code);
  try {
    const result = await db.transaction(async (tx) => {
      const [code] = await tx
        .select()
        .from(compCodesTable)
        .where(eq(compCodesTable.codeHash, codeHash))
        .for("update");
      if (!code || code.revokedAt) return { status: 400 as const };
      const [existingGrant] = await tx
        .select({ id: compGrantsTable.id })
        .from(compGrantsTable)
        .where(and(eq(compGrantsTable.userId, user.id), isNull(compGrantsTable.revokedAt)));
      if (existingGrant) return { status: 409 as const };
      const liveRedemptions = await tx
        .select({ id: compRedemptionsTable.id })
        .from(compRedemptionsTable)
        .where(and(eq(compRedemptionsTable.codeId, code.id), isNull(compRedemptionsTable.revokedAt)));
      if (code.singleUse && liveRedemptions.length > 0) return { status: 400 as const };
      const [redemption] = await tx.insert(compRedemptionsTable).values({
        codeId: code.id,
        userId: user.id,
      }).returning();
      await tx.insert(compGrantsTable).values({
        userId: user.id,
        redemptionId: redemption.id,
        activeUserId: user.id,
      });
      return { status: 200 as const };
    });
    if (result.status === 409) {
      res.status(409).json({ error: "This account already has comp access" });
      return;
    }
    if (result.status === 400) {
      res.status(400).json({ error: "That code is not valid" });
      return;
    }
    res.json({ entitlement: "comp" });
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "This account already has comp access" });
      return;
    }
    throw error;
  }
});

router.post("/comp-codes/:id/revoke", async (req, res): Promise<void> => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const revoked = await db.transaction(async (tx) => {
    const [code] = await tx
      .update(compCodesTable)
      .set({ revokedAt: new Date(), revokedByUserId: admin.id })
      .where(and(eq(compCodesTable.id, id), isNull(compCodesTable.revokedAt)))
      .returning();
    if (!code) return false;
    const redemptions = await tx
      .update(compRedemptionsTable)
      .set({ revokedAt: new Date(), revokedByUserId: admin.id })
      .where(and(eq(compRedemptionsTable.codeId, code.id), isNull(compRedemptionsTable.revokedAt)))
      .returning({ id: compRedemptionsTable.id });
    for (const redemption of redemptions) {
      await tx
        .update(compGrantsTable)
        .set({ revokedAt: new Date(), revokedByUserId: admin.id, activeUserId: null })
        .where(eq(compGrantsTable.redemptionId, redemption.id));
    }
    return true;
  });
  if (!revoked) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await writeAudit(admin.id, "comp_code.revoke", "comp_code", id, null);
  res.json({ revoked: true });
});

router.get("/comp-delegates", async (req, res): Promise<void> => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const [row] = await db
    .select({
      id: compDelegatesTable.id,
      userId: usersTable.id,
      email: usersTable.email,
      displayName: usersTable.displayName,
      createdAt: compDelegatesTable.createdAt,
    })
    .from(compDelegatesTable)
    .innerJoin(usersTable, eq(compDelegatesTable.userId, usersTable.id))
    .where(isNull(compDelegatesTable.revokedAt));
  res.json({
    delegate: row
      ? {
          id: row.id,
          userId: row.userId,
          email: row.email,
          displayName: row.displayName,
          createdAt: row.createdAt.toISOString(),
        }
      : null,
  });
});

router.post("/comp-delegates", async (req, res): Promise<void> => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const parsed = delegateBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const [account] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!account) {
    res.status(404).json({ error: "No account with that email" });
    return;
  }
  try {
    const [row] = await db.insert(compDelegatesTable).values({
      userId: account.id,
      designatedByUserId: admin.id,
      activeKey: 1,
    }).returning();
    await writeAudit(admin.id, "comp_delegate.designate", "user", account.id, email);
    res.status(201).json({
      id: row.id,
      userId: account.id,
      email: account.email,
      displayName: account.displayName,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "A comp delegate is already designated" });
      return;
    }
    throw error;
  }
});

router.delete("/comp-delegates", async (req, res): Promise<void> => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const [row] = await db
    .update(compDelegatesTable)
    .set({ revokedAt: new Date(), revokedByUserId: admin.id, activeKey: null })
    .where(isNull(compDelegatesTable.revokedAt))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await writeAudit(admin.id, "comp_delegate.revoke", "user", row.userId, null);
  res.status(204).send();
});

export default router;
