import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import {
  compCodeIncidentsTable,
  compCodesTable,
  compGrantsTable,
  compRedemptionsTable,
  db,
  moderationEventsTable,
  pool,
  usersTable,
} from "@workspace/db";
import app from "../src/app.ts";
import { setCompIncidentEmailTransport } from "../src/auth/comp-incident-notifier.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
let server: http.Server;
let baseUrl = "";
let hook: http.Server | null = null;
const webhookBodies: unknown[] = [];
const emailed: { address: string; incidentId: number }[] = [];

async function request(
  method: string,
  pathname: string,
  options: { body?: unknown; cookie?: string; userAgent?: string } = {},
) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      ...(options.cookie ? { cookie: options.cookie } : {}),
      ...(options.userAgent ? { "user-agent": options.userAgent } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let json: unknown = null;
  if (text) json = JSON.parse(text);
  return { status: response.status, json, cookie: response.headers.get("set-cookie") ?? "" };
}

function sessionCookie(setCookie: string): string {
  const pair = setCookie.split(";")[0];
  assert.ok(pair?.startsWith("arc_session="));
  return pair;
}

async function register(email: string, displayName: string) {
  const created = await request("POST", "/api/auth/register", {
    body: { email, password: "correct horse battery", displayName },
  });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  return sessionCookie(created.cookie);
}

before(async () => {
  execFileSync(
    "pnpm",
    ["--filter", "@workspace/db", "exec", "drizzle-kit", "push", "--force", "--config", "./drizzle.config.ts"],
    {
      cwd: root,
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:password@127.0.0.1:5432/archive_research_center_test",
      },
      stdio: "inherit",
    },
  );
  await db.execute(sql`
    TRUNCATE TABLE
      comp_code_incident_reads,
      comp_code_incidents,
      moderation_events,
      forum_room_posts,
      forum_room_invites,
      forum_room_members,
      forum_rooms,
      comp_grants,
      comp_redemptions,
      comp_codes,
      comp_delegates,
      service_tokens,
      evidence,
      notes,
      saved_sources,
      claim_cards,
      forum_replies,
      forum_threads,
      translations,
      research_projects,
      sessions,
      users,
      sources
    RESTART IDENTITY CASCADE
  `);
  hook = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk as Buffer));
    req.on("end", () => {
      webhookBodies.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      res.writeHead(204);
      res.end();
    });
  });
  await new Promise<void>((resolve) => hook?.listen(0, "127.0.0.1", () => resolve()));
  server = await new Promise<http.Server>((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  delete process.env.COMP_INCIDENT_WEBHOOK_URL;
  delete process.env.COMP_INCIDENT_NOTIFY_EMAIL;
  setCompIncidentEmailTransport(null);
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  if (hook) {
    await new Promise<void>((resolve, reject) => {
      hook?.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await pool.end();
});

test("a comp code binds to the first account and a later account opens an incident", async () => {
  const owner = await register("ada.bind@example.com", "Ada Owner");
  const delegate = await register("grace.bind@example.com", "Grace Delegate");
  const holder = await register("ida.bind@example.com", "Ida Holder");
  const stranger = await register("ned.bind@example.com", "Ned Stranger");

  const strangerCreate = await request("POST", "/api/comp-codes", { cookie: stranger, body: {} });
  assert.equal(strangerCreate.status, 403);
  const strangerList = await request("GET", "/api/comp-code-incidents", { cookie: stranger });
  assert.equal(strangerList.status, 403);
  const strangerRevoke = await request("POST", "/api/comp-codes/1/revoke", { cookie: stranger, body: {} });
  assert.equal(strangerRevoke.status, 403);

  await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.email, "ada.bind@example.com"));
  const ownerMe = await request("GET", "/api/auth/me", { cookie: owner });
  assert.equal((ownerMe.json as { compStaff: boolean }).compStaff, true);
  const designated = await request("POST", "/api/comp-delegates", {
    cookie: owner,
    body: { email: "grace.bind@example.com" },
  });
  assert.equal(designated.status, 201);
  const delegateMe = await request("GET", "/api/auth/me", { cookie: delegate });
  assert.equal((delegateMe.json as { compStaff: boolean }).compStaff, true);
  const strangerMe = await request("GET", "/api/auth/me", { cookie: stranger });
  assert.equal((strangerMe.json as { compStaff: boolean }).compStaff, false);
  const holderMe = await request("GET", "/api/auth/me", { cookie: holder });
  const holderId = (holderMe.json as { id: number }).id;
  const strangerId = (strangerMe.json as { id: number }).id;

  const minted = await request("POST", "/api/comp-codes", { cookie: delegate, body: { label: "VIP" } });
  assert.equal(minted.status, 201);
  const secret = minted.json as { id: number; code: string };
  const delegateRevoke = await request("POST", `/api/comp-codes/${secret.id}/revoke`, { cookie: delegate, body: {} });
  assert.equal(delegateRevoke.status, 403);

  const redeemed = await request("POST", "/api/comp-codes/redeem", { cookie: holder, body: { code: secret.code } });
  assert.equal(redeemed.status, 200);
  const [bound] = await db.select().from(compCodesTable).where(eq(compCodesTable.id, secret.id));
  assert.equal(bound.boundUserId, holderId);
  assert.ok(bound.boundAt);
  assert.equal(bound.revokedAt, null);

  const again = await request("POST", "/api/comp-codes/redeem", { cookie: holder, body: { code: secret.code } });
  assert.equal(again.status, 200);
  assert.equal((again.json as { entitlement: string }).entitlement, "comp");
  const redemptions = await db.select().from(compRedemptionsTable).where(eq(compRedemptionsTable.codeId, secret.id));
  assert.equal(redemptions.length, 1);
  assert.equal((await db.select().from(compCodeIncidentsTable)).length, 0);

  const hookAddress = hook?.address();
  if (!hookAddress || typeof hookAddress === "string") throw new Error("Hook did not bind");
  process.env.COMP_INCIDENT_WEBHOOK_URL = `http://127.0.0.1:${hookAddress.port}/`;
  process.env.COMP_INCIDENT_NOTIFY_EMAIL = "alerts@example.test";
  setCompIncidentEmailTransport(async (address, notice) => {
    emailed.push({ address, incidentId: notice.incidentId });
  });

  const blocked = await request("POST", "/api/comp-codes/redeem", {
    cookie: stranger,
    userAgent: "ArcInvestigation/1.0",
    body: { code: secret.code },
  });
  const missing = await request("POST", "/api/comp-codes/redeem", {
    cookie: stranger,
    body: { code: "ARC-not-a-real-code" },
  });
  assert.equal(blocked.status, 400);
  assert.equal(missing.status, 400);
  assert.equal((blocked.json as { error: string }).error, (missing.json as { error: string }).error);
  const blockedText = JSON.stringify(blocked.json);
  assert.equal(blockedText.includes("ida.bind@example.com"), false);
  assert.equal(blockedText.includes("Ida Holder"), false);

  const [incident] = await db.select().from(compCodeIncidentsTable);
  assert.equal(incident.codeId, secret.id);
  assert.equal(incident.attemptingUserId, strangerId);
  assert.equal(incident.userAgent, "ArcInvestigation/1.0");
  assert.equal(incident.status, "open");
  assert.ok(incident.ip.length > 0);
  const audits = await db
    .select()
    .from(moderationEventsTable)
    .where(eq(moderationEventsTable.action, "comp_code.incident"));
  assert.equal(audits.length, 1);
  assert.equal(audits[0]?.actorUserId, strangerId);

  const holderAfter = await request("GET", "/api/auth/me", { cookie: holder });
  assert.equal((holderAfter.json as { entitlement: string }).entitlement, "comp");
  const strangerAfter = await request("GET", "/api/auth/me", { cookie: stranger });
  assert.equal(strangerAfter.status, 200);
  assert.equal((strangerAfter.json as { entitlement: string }).entitlement, "free");
  const [stillBound] = await db.select().from(compCodesTable).where(eq(compCodesTable.id, secret.id));
  assert.equal(stillBound.revokedAt, null);
  assert.equal(stillBound.boundUserId, holderId);
  const grants = await db.select().from(compGrantsTable).where(eq(compGrantsTable.userId, holderId));
  assert.equal(grants.filter((row) => row.revokedAt === null).length, 1);

  const ownerUnread = await request("GET", "/api/comp-code-incidents/unread", { cookie: owner });
  const delegateUnread = await request("GET", "/api/comp-code-incidents/unread", { cookie: delegate });
  assert.equal((ownerUnread.json as { count: number }).count, 1);
  assert.equal((delegateUnread.json as { count: number }).count, 1);
  const delegateView = await request("GET", "/api/comp-code-incidents", { cookie: delegate });
  assert.equal(delegateView.status, 200);
  const listed = delegateView.json as { ip: string; userAgent: string; attemptingUserId: number }[];
  assert.equal(listed[0]?.userAgent, "ArcInvestigation/1.0");
  assert.equal(listed[0]?.attemptingUserId, strangerId);
  assert.ok(listed[0]?.ip);
  const ownerView = await request("GET", "/api/comp-code-incidents", { cookie: owner });
  assert.equal(ownerView.status, 200);
  const ownerUnreadAfter = await request("GET", "/api/comp-code-incidents/unread", { cookie: owner });
  const delegateUnreadAfter = await request("GET", "/api/comp-code-incidents/unread", { cookie: delegate });
  assert.equal((ownerUnreadAfter.json as { count: number }).count, 0);
  assert.equal((delegateUnreadAfter.json as { count: number }).count, 0);

  const resolved = await request("POST", `/api/comp-code-incidents/${incident.id}/resolve`, {
    cookie: delegate,
    body: { status: "reviewed" },
  });
  assert.equal(resolved.status, 200);
  const strangerResolve = await request("POST", `/api/comp-code-incidents/${incident.id}/resolve`, {
    cookie: stranger,
    body: { status: "dismissed" },
  });
  assert.equal(strangerResolve.status, 403);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const repeat = await request("POST", "/api/comp-codes/redeem", {
      cookie: stranger,
      userAgent: "ArcInvestigation/1.0",
      body: { code: secret.code },
    });
    assert.equal(repeat.status === 400 || repeat.status === 429, true);
  }
  const incidents = await db.select().from(compCodeIncidentsTable);
  assert.equal(incidents.length, 3);
  let sawLimited = false;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const limited = await request("POST", "/api/comp-codes/redeem", {
      cookie: stranger,
      body: { code: `ARC-not-a-real-code-${attempt}` },
    });
    if (limited.status === 429) {
      sawLimited = true;
      break;
    }
  }
  assert.equal(sawLimited, true);
  assert.equal((await db.select().from(compCodeIncidentsTable)).length, 3);

  const ownerCode = await request("POST", "/api/comp-codes", { cookie: owner, body: {} });
  assert.equal(ownerCode.status, 201);
  const revoked = await request("POST", `/api/comp-codes/${secret.id}/revoke`, { cookie: owner, body: {} });
  assert.equal(revoked.status, 200);
  const holderRevoked = await request("GET", "/api/auth/me", { cookie: holder });
  assert.equal((holderRevoked.json as { entitlement: string }).entitlement, "free");

  assert.ok(webhookBodies.length >= 1);
  assert.ok(webhookBodies.length <= 3);
  const notice = webhookBodies[0] as { type: string; codeHint: string; attemptingUserId: number };
  assert.equal(notice.type, "comp_code_incident");
  assert.equal(notice.attemptingUserId, strangerId);
  assert.equal(JSON.stringify(webhookBodies).includes(secret.code), false);
  assert.ok(emailed.length >= 1);
  assert.equal(emailed.every((row) => row.address === "alerts@example.test"), true);
});
