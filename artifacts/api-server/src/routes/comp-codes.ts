import { Router, type Request, type Response } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  compCodeIncidentReadsTable,
  compCodeIncidentsTable,
  compCodesTable,
  compDelegatesTable,
  compGrantsTable,
  compRedemptionsTable,
  db,
  usersTable,
} from "@workspace/db";
import { writeAudit } from "../auth/audit";
import { notifyCompIncident } from "../auth/comp-incident-notifier";
import { isCompStaff } from "../auth/comp-staff";
import { requireAdmin, requireUser } from "../auth/middleware";
import { hashOpaqueSecret, newOpaqueCode } from "../auth/secrets";
import { parseIntParam, sendValidationError } from "../lib/http";
import { createBudget } from "../lib/security";
import { compCodeCreateBody, delegateBody, incidentResolveBody, redeemCodeBody } from "../validation/bodies";

const router = Router();

const REDEEM_WINDOW_MS = 15 * 60_000;
const allowRedeemForAccount = createBudget({ windowMs: REDEEM_WINDOW_MS, max: 10 });
const allowIncidentForAccount = createBudget({ windowMs: REDEEM_WINDOW_MS, max: 3 });
const allowIncidentForIp = createBudget({ windowMs: REDEEM_WINDOW_MS, max: 5 });

function clientIp(req: Request): string {
  return (req.ip || req.socket.remoteAddress || "unknown").slice(0, 80);
}

function clientUserAgent(req: Request): string {
  return (req.get("user-agent") || "unknown").slice(0, 500);
}

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current && typeof current === "object"; depth += 1) {
    if ("code" in current && (current as { code?: unknown }).code === "23505") return true;
    current = "cause" in current ? (current as { cause?: unknown }).cause : undefined;
  }
  return false;
}

async function issuerAllowed(userId: number, role: string): Promise<boolean> {
  return isCompStaff({ id: userId, role });
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
  if (!allowRedeemForAccount(`acct:${user.id}`)) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  const parsed = redeemCodeBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const codeHash = hashOpaqueSecret("comp", parsed.data.code);
  const ip = clientIp(req);
  const userAgent = clientUserAgent(req);
  try {
    const result = await db.transaction(async (tx) => {
      const [code] = await tx
        .select()
        .from(compCodesTable)
        .where(eq(compCodesTable.codeHash, codeHash))
        .for("update");
      if (!code || code.revokedAt) return { kind: "invalid" as const };

      let holderId = code.boundUserId;
      if (!holderId && code.boundAt) return { kind: "mismatch" as const, code };
      if (!holderId) {
        const [prior] = await tx
          .select({ userId: compRedemptionsTable.userId, redeemedAt: compRedemptionsTable.redeemedAt })
          .from(compRedemptionsTable)
          .where(and(eq(compRedemptionsTable.codeId, code.id), isNull(compRedemptionsTable.revokedAt)))
          .orderBy(compRedemptionsTable.redeemedAt)
          .limit(1);
        if (prior) {
          holderId = prior.userId;
          await tx
            .update(compCodesTable)
            .set({ boundUserId: prior.userId, boundAt: prior.redeemedAt })
            .where(eq(compCodesTable.id, code.id));
        }
      }
      if (holderId === user.id) return { kind: "noop" as const };
      if (holderId) return { kind: "mismatch" as const, code };

      const [existingGrant] = await tx
        .select({ id: compGrantsTable.id })
        .from(compGrantsTable)
        .where(and(eq(compGrantsTable.userId, user.id), isNull(compGrantsTable.revokedAt)));
      if (existingGrant) return { kind: "already" as const };
      const [redemption] = await tx.insert(compRedemptionsTable).values({
        codeId: code.id,
        userId: user.id,
      }).returning();
      await tx.insert(compGrantsTable).values({
        userId: user.id,
        redemptionId: redemption.id,
        activeUserId: user.id,
      });
      await tx
        .update(compCodesTable)
        .set({ boundUserId: user.id, boundAt: new Date() })
        .where(eq(compCodesTable.id, code.id));
      return { kind: "bound" as const };
    });
    if (result.kind === "already") {
      res.status(409).json({ error: "This account already has comp access" });
      return;
    }
    if (result.kind === "invalid") {
      res.status(400).json({ error: "That code is not valid" });
      return;
    }
    if (result.kind === "mismatch") {
      const accountOk = allowIncidentForAccount(`acct:${user.id}`);
      const ipOk = allowIncidentForIp(`ip:${ip}`);
      const withinAlertBudget = accountOk && ipOk;
      if (withinAlertBudget) {
        const [incident] = await db.insert(compCodeIncidentsTable).values({
          codeId: result.code.id,
          attemptingUserId: user.id,
          ip,
          userAgent,
        }).returning();
        await writeAudit(
          user.id,
          "comp_code.incident",
          "comp_code",
          result.code.id,
          `blocked redemption from ${ip}`,
        );
        await notifyCompIncident({
          incidentId: incident.id,
          codeId: result.code.id,
          codeHint: result.code.codeHint,
          attemptingUserId: user.id,
          createdAt: incident.createdAt.toISOString(),
        });
      }
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

async function requireCompStaff(req: Request, res: Response) {
  const user = requireUser(req, res);
  if (!user) return null;
  if (!(await isCompStaff(user))) {
    res.status(403).json({ error: "Only an administrator or the comp delegate can view comp incidents" });
    return null;
  }
  return user;
}

router.get("/comp-code-incidents/unread", async (req, res): Promise<void> => {
  const user = await requireCompStaff(req, res);
  if (!user) return;
  const [incidents, reads] = await Promise.all([
    db.select({ id: compCodeIncidentsTable.id }).from(compCodeIncidentsTable),
    db
      .select({ incidentId: compCodeIncidentReadsTable.incidentId })
      .from(compCodeIncidentReadsTable)
      .where(eq(compCodeIncidentReadsTable.userId, user.id)),
  ]);
  const seen = new Set(reads.map((row) => row.incidentId));
  res.json({ count: incidents.filter((row) => !seen.has(row.id)).length });
});

router.get("/comp-code-incidents", async (req, res): Promise<void> => {
  const user = await requireCompStaff(req, res);
  if (!user) return;
  const rows = await db
    .select({
      id: compCodeIncidentsTable.id,
      codeId: compCodeIncidentsTable.codeId,
      codeHint: compCodesTable.codeHint,
      boundUserId: compCodesTable.boundUserId,
      attemptingUserId: compCodeIncidentsTable.attemptingUserId,
      attemptingEmail: usersTable.email,
      attemptingName: usersTable.displayName,
      ip: compCodeIncidentsTable.ip,
      userAgent: compCodeIncidentsTable.userAgent,
      status: compCodeIncidentsTable.status,
      createdAt: compCodeIncidentsTable.createdAt,
      resolvedAt: compCodeIncidentsTable.resolvedAt,
    })
    .from(compCodeIncidentsTable)
    .innerJoin(compCodesTable, eq(compCodesTable.id, compCodeIncidentsTable.codeId))
    .innerJoin(usersTable, eq(usersTable.id, compCodeIncidentsTable.attemptingUserId))
    .orderBy(desc(compCodeIncidentsTable.createdAt))
    .limit(100);
  if (rows.length > 0) {
    await db
      .insert(compCodeIncidentReadsTable)
      .values(rows.map((row) => ({ incidentId: row.id, userId: user.id })))
      .onConflictDoNothing({
        target: [compCodeIncidentReadsTable.incidentId, compCodeIncidentReadsTable.userId],
      });
  }
  res.json(rows.map((row) => ({
    id: row.id,
    codeId: row.codeId,
    codeHint: row.codeHint,
    boundUserId: row.boundUserId,
    attemptingUserId: row.attemptingUserId,
    attemptingEmail: row.attemptingEmail,
    attemptingName: row.attemptingName,
    ip: row.ip,
    userAgent: row.userAgent,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  })));
});

router.post("/comp-code-incidents/:id/resolve", async (req, res): Promise<void> => {
  const user = await requireCompStaff(req, res);
  if (!user) return;
  const id = parseIntParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = incidentResolveBody.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }
  const [row] = await db
    .update(compCodeIncidentsTable)
    .set({
      status: parsed.data.status,
      resolvedAt: new Date(),
      resolvedByUserId: user.id,
    })
    .where(eq(compCodeIncidentsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await writeAudit(user.id, "comp_code.incident.resolve", "comp_code_incident", id, parsed.data.status);
  res.json({ id: row.id, status: row.status, resolvedAt: row.resolvedAt?.toISOString() ?? null });
});

export default router;
