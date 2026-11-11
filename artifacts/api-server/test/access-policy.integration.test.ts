import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import app from "../src/app.ts";
import { hashOpaqueSecret } from "../src/auth/secrets.ts";
import {
  compCodesTable,
  db,
  pool,
  usersTable,
} from "@workspace/db";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
let server: http.Server;
let baseUrl = "";

async function request(
  method: string,
  pathname: string,
  options: { body?: unknown; cookie?: string; origin?: string; authorization?: string } = {},
) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      ...(options.cookie ? { cookie: options.cookie } : {}),
      ...(options.origin ? { origin: options.origin } : {}),
      ...(options.authorization ? { authorization: options.authorization } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }
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

async function setRole(email: string, role: string) {
  await db.update(usersTable).set({ role }).where(eq(usersTable.email, email));
}

async function setBilling(email: string, billingEntitlement: string) {
  await db.update(usersTable).set({ billingEntitlement }).where(eq(usersTable.email, email));
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
  server = await new Promise<http.Server>((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await pool.end();
});

describe("access policy", { concurrency: 1 }, () => {
  test("concierge requires a session and stays historical", async () => {
    const signedOut = await request("GET", "/api/concierge/paths");
    assert.equal(signedOut.status, 401);
    const recommendOut = await request("POST", "/api/concierge/recommend", {
      body: { researcherType: "historian", interests: [] },
    });
    assert.equal(recommendOut.status, 401);

    const cookie = await register("ada.policy@example.com", "Ada Policy");
    const paths = await request("GET", "/api/concierge/paths", { cookie });
    assert.equal(paths.status, 200);
    const list = paths.json as { id: string; description: string }[];
    assert.ok(list.length > 0);
    const blob = JSON.stringify(list).toLowerCase();
    assert.equal(blob.includes("genealog"), false);
    assert.equal(blob.includes("dna"), false);

    const recommendation = await request("POST", "/api/concierge/recommend", {
      cookie,
      body: { researcherType: "historian", interests: [], experienceLevel: "advanced" },
    });
    assert.equal(recommendation.status, 200);
    assert.equal(JSON.stringify(recommendation.json).toLowerCase().includes("dna"), false);

    const rejected = await request("POST", "/api/concierge/recommend", {
      cookie,
      body: { researcherType: "genealogist", interests: [] },
    });
    assert.equal(rejected.status, 400);
  });

  test("public forum posts stay with their author, and moderators are audited", async () => {
    const signedOutList = await request("GET", "/api/forum/threads");
    assert.equal(signedOutList.status, 200);
    const categories = await request("GET", "/api/forum/categories");
    assert.equal(categories.status, 200);
    assert.ok((categories.json as string[]).includes("Sources"));

    const blocked = await request("POST", "/api/forum/threads", {
      body: { title: "No session", content: "Should fail", category: "Sources" },
    });
    assert.equal(blocked.status, 401);

    const ada = await register("ada.forum@example.com", "Ada Forum");
    const grace = await register("grace.forum@example.com", "Grace Forum");
    const badCategory = await request("POST", "/api/forum/threads", {
      cookie: ada,
      body: { title: "Bad", content: "Nope", category: "genealogy" },
    });
    assert.equal(badCategory.status, 400);

    const created = await request("POST", "/api/forum/threads", {
      cookie: ada,
      body: { title: "Tacitus and the manuscript", content: "Original post", category: "Sources" },
    });
    assert.equal(created.status, 201);
    const thread = created.json as { id: number; userId: number };
    const stolen = await request("PATCH", `/api/forum/threads/${thread.id}`, {
      cookie: grace,
      body: { title: "Taken" },
    });
    assert.equal(stolen.status, 404);
    const updated = await request("PATCH", `/api/forum/threads/${thread.id}`, {
      cookie: ada,
      body: { title: "Tacitus, revised" },
    });
    assert.equal(updated.status, 200);
    assert.equal((updated.json as { title: string }).title, "Tacitus, revised");

    const reply = await request("POST", `/api/forum/threads/${thread.id}/replies`, {
      cookie: grace,
      body: { content: "A reply from Grace" },
    });
    assert.equal(reply.status, 201);
    const replyId = (reply.json as { id: number }).id;
    const stolenReply = await request("DELETE", `/api/forum/replies/${replyId}`, { cookie: ada });
    assert.equal(stolenReply.status, 404);

    await setRole("ada.forum@example.com", "moderator");
    const userHide = await request("POST", `/api/moderation/threads/${thread.id}/hide`, { cookie: grace });
    assert.equal(userHide.status, 403);
    const hidden = await request("POST", `/api/moderation/threads/${thread.id}/hide`, {
      cookie: ada,
      body: { reason: "Off topic" },
    });
    assert.equal(hidden.status, 200);
    const gone = await request("GET", `/api/forum/threads/${thread.id}`, { cookie: grace });
    assert.equal(gone.status, 404);
    const moderatorView = await request("GET", `/api/forum/threads/${thread.id}`, { cookie: ada });
    assert.equal(moderatorView.status, 200);
    assert.equal((moderatorView.json as { thread: { hidden: boolean } }).thread.hidden, true);

    const auditDenied = await request("GET", "/api/moderation/audit", { cookie: ada });
    assert.equal(auditDenied.status, 403);
    await setRole("ada.forum@example.com", "admin");
    const audit = await request("GET", "/api/moderation/audit", { cookie: ada });
    assert.equal(audit.status, 200);
    const events = audit.json as { action: string; reason: string | null }[];
    assert.ok(events.some((event) => event.action === "thread.hide" && event.reason === "Off topic"));

    const visible = await request("POST", `/api/moderation/threads/${thread.id}/unhide`, { cookie: ada });
    assert.equal(visible.status, 200);
    const locked = await request("POST", `/api/moderation/threads/${thread.id}/lock`, { cookie: ada });
    assert.equal(locked.status, 200);
    const lockedReply = await request("POST", `/api/forum/threads/${thread.id}/replies`, {
      cookie: grace,
      body: { content: "Too late" },
    });
    assert.equal(lockedReply.status, 403);

    const suspended = await request("POST", `/api/moderation/users/${(reply.json as { userId: number }).userId}/suspend`, {
      cookie: ada,
      body: { reason: "Repeated disruption" },
    });
    assert.equal(suspended.status, 200);
    const secondThread = await request("POST", "/api/forum/threads", {
      cookie: grace,
      body: { title: "While suspended", content: "No", category: "Methodology" },
    });
    assert.equal(secondThread.status, 403);
    await request("POST", `/api/moderation/users/${(reply.json as { userId: number }).userId}/restore`, { cookie: ada });

    const service = await request("POST", "/api/moderation/service-accounts", {
      cookie: ada,
      body: { email: "moderator-bot@archive.local", displayName: "Commons Moderator" },
    });
    assert.equal(service.status, 201);
    const token = (service.json as { token: string }).token;
    assert.ok(token.startsWith("SVC-"));
    const browserLogin = await request("POST", "/api/auth/login", {
      body: { email: "moderator-bot@archive.local", password: "correct horse battery" },
    });
    assert.equal(browserLogin.status, 401);

    const another = await request("POST", "/api/forum/threads", {
      cookie: grace,
      body: { title: "Bot target", content: "Still here", category: "Chronology" },
    });
    assert.equal(another.status, 201);
    const botHide = await request("POST", `/api/moderation/threads/${(another.json as { id: number }).id}/hide`, {
      authorization: `Bearer ${token}`,
      body: { reason: "Service moderation" },
    });
    assert.equal(botHide.status, 200);
    const afterBot = await request("GET", `/api/forum/threads/${(another.json as { id: number }).id}`);
    assert.equal(afterBot.status, 404);
  });

  test("comp codes are hashed, single-use, revocable, and limited to one delegate", async () => {
    const ada = await register("ada.comp@example.com", "Ada Comp");
    const grace = await register("grace.comp@example.com", "Grace Comp");
    const ida = await register("ida.comp@example.com", "Ida Comp");

    const denied = await request("POST", "/api/comp-codes", { cookie: grace, body: {} });
    assert.equal(denied.status, 403);
    const delegateDenied = await request("POST", "/api/comp-delegates", {
      cookie: grace,
      body: { email: "ida.comp@example.com" },
    });
    assert.equal(delegateDenied.status, 403);

    await setRole("ada.comp@example.com", "admin");
    const designated = await request("POST", "/api/comp-delegates", {
      cookie: ada,
      body: { email: "grace.comp@example.com" },
    });
    assert.equal(designated.status, 201);
    const second = await request("POST", "/api/comp-delegates", {
      cookie: ada,
      body: { email: "ida.comp@example.com" },
    });
    assert.equal(second.status, 409);

    const minted = await request("POST", "/api/comp-codes", {
      cookie: grace,
      body: { label: "Reading room guest" },
    });
    assert.equal(minted.status, 201);
    const mintedBody = minted.json as { id: number; code: string; singleUse: boolean };
    assert.equal(mintedBody.singleUse, true);
    assert.equal(mintedBody.code.includes("ARC-"), true);
    const [stored] = await db.select().from(compCodesTable).where(eq(compCodesTable.id, mintedBody.id));
    assert.equal(stored.codeHash, hashOpaqueSecret("comp", mintedBody.code));
    assert.equal(stored.codeHash.includes(mintedBody.code), false);

    const crossSite = await request("POST", "/api/comp-codes/redeem", {
      cookie: ida,
      origin: "https://evil.example",
      body: { code: mintedBody.code },
    });
    assert.equal(crossSite.status, 403);

    const redeemed = await request("POST", "/api/comp-codes/redeem", {
      cookie: ida,
      body: { code: mintedBody.code },
    });
    assert.equal(redeemed.status, 200);
    const me = await request("GET", "/api/auth/me", { cookie: ida });
    assert.equal((me.json as { entitlement: string }).entitlement, "comp");
    const again = await request("POST", "/api/comp-codes/redeem", {
      cookie: grace,
      body: { code: mintedBody.code },
    });
    assert.equal(again.status, 400);

    const delegateRevoke = await request("POST", `/api/comp-codes/${mintedBody.id}/revoke`, { cookie: grace });
    assert.equal(delegateRevoke.status, 403);
    const revoked = await request("POST", `/api/comp-codes/${mintedBody.id}/revoke`, { cookie: ada });
    assert.equal(revoked.status, 200);
    const afterRevoke = await request("GET", "/api/auth/me", { cookie: ida });
    assert.equal((afterRevoke.json as { entitlement: string }).entitlement, "free");

    await setBilling("grace.comp@example.com", "paid");
    const paidCode = await request("POST", "/api/comp-codes", { cookie: ada, body: { singleUse: true } });
    const paidSecret = (paidCode.json as { id: number; code: string });
    const paidRedeem = await request("POST", "/api/comp-codes/redeem", {
      cookie: grace,
      body: { code: paidSecret.code },
    });
    assert.equal(paidRedeem.status, 200);
    const compOverrides = await request("GET", "/api/auth/me", { cookie: grace });
    assert.equal((compOverrides.json as { entitlement: string }).entitlement, "comp");
    await request("POST", `/api/comp-codes/${paidSecret.id}/revoke`, { cookie: ada });
    const backToPaid = await request("GET", "/api/auth/me", { cookie: grace });
    assert.equal((backToPaid.json as { entitlement: string }).entitlement, "paid");

    await request("DELETE", "/api/comp-delegates", { cookie: ada });
    const afterDelegateRevoke = await request("POST", "/api/comp-codes", { cookie: grace, body: {} });
    assert.equal(afterDelegateRevoke.status, 403);
    const redesignated = await request("POST", "/api/comp-delegates", {
      cookie: ada,
      body: { email: "ida.comp@example.com" },
    });
    assert.equal(redesignated.status, 201);
  });

  test("private rooms are invisible to non-members and members-only by default", async () => {
    delete process.env.PRIVATE_ROOMS_ALLOW_FREE_GUESTS;
    const owner = await register("ada.room@example.com", "Ada Room");
    const stranger = await register("grace.room@example.com", "Grace Room");
    const guest = await register("ida.room@example.com", "Ida Room");
    await setBilling("ada.room@example.com", "paid");

    const deniedCreate = await request("POST", "/api/rooms", {
      cookie: guest,
      body: { name: "Should fail", description: "Free accounts cannot open a room" },
    });
    assert.equal(deniedCreate.status, 403);

    const room = await request("POST", "/api/rooms", {
      cookie: owner,
      body: { name: "Manuscript workshop", description: "Invitation only" },
    });
    assert.equal(room.status, 201);
    const roomId = (room.json as { id: number }).id;

    const hidden = await request("GET", `/api/rooms/${roomId}`, { cookie: stranger });
    assert.equal(hidden.status, 404);
    const strangerList = await request("GET", "/api/rooms", { cookie: stranger });
    assert.equal((strangerList.json as unknown[]).length, 0);
    const peek = await request("GET", `/api/rooms/${roomId}/posts`, { cookie: stranger });
    assert.equal(peek.status, 404);
    const intrude = await request("POST", `/api/rooms/${roomId}/posts`, {
      cookie: stranger,
      body: { content: "I should not be here" },
    });
    assert.equal(intrude.status, 404);

    const invite = await request("POST", `/api/rooms/${roomId}/invites`, { cookie: owner, body: {} });
    assert.equal(invite.status, 201);
    const code = (invite.json as { code: string }).code;
    const freeJoin = await request("POST", "/api/rooms/join", { cookie: guest, body: { code } });
    assert.equal(freeJoin.status, 403);

    process.env.PRIVATE_ROOMS_ALLOW_FREE_GUESTS = "1";
    const allowed = await request("POST", "/api/rooms/join", { cookie: guest, body: { code } });
    assert.equal(allowed.status, 200);
    delete process.env.PRIVATE_ROOMS_ALLOW_FREE_GUESTS;

    const memberPost = await request("POST", `/api/rooms/${roomId}/posts`, {
      cookie: guest,
      body: { content: "A note on the colophon" },
    });
    assert.equal(memberPost.status, 201);
    const strangerRemove = await request("DELETE", `/api/rooms/${roomId}/members/${(memberPost.json as { userId: number }).userId}`, {
      cookie: stranger,
    });
    assert.equal(strangerRemove.status, 404);
    const removed = await request("DELETE", `/api/rooms/${roomId}/members/${(memberPost.json as { userId: number }).userId}`, {
      cookie: owner,
    });
    assert.equal(removed.status, 204);
    const afterRemoval = await request("GET", `/api/rooms/${roomId}`, { cookie: guest });
    assert.equal(afterRemoval.status, 404);

    await setRole("grace.room@example.com", "moderator");
    const safety = await request("GET", `/api/rooms/${roomId}`, { cookie: stranger });
    assert.equal(safety.status, 200);
    const safetyList = await request("GET", "/api/rooms", { cookie: stranger });
    assert.equal((safetyList.json as unknown[]).length, 0);

    const compVisitor = await register("comp.room@example.com", "Comp Visitor");
    await setRole("ada.room@example.com", "admin");
    const compCode = await request("POST", "/api/comp-codes", { cookie: owner, body: {} });
    assert.equal(compCode.status, 201);
    const compRedeem = await request("POST", "/api/comp-codes/redeem", {
      cookie: compVisitor,
      body: { code: (compCode.json as { code: string }).code },
    });
    assert.equal(compRedeem.status, 200);
    const secondInvite = await request("POST", `/api/rooms/${roomId}/invites`, {
      cookie: owner,
      body: { expiresAt: new Date(Date.now() + 60_000).toISOString() },
    });
    const compJoin = await request("POST", "/api/rooms/join", {
      cookie: compVisitor,
      body: { code: (secondInvite.json as { code: string }).code },
    });
    assert.equal(compJoin.status, 200);

    const expired = await request("POST", `/api/rooms/${roomId}/invites`, {
      cookie: owner,
      body: { expiresAt: new Date(Date.now() - 60_000).toISOString() },
    });
    assert.equal(expired.status, 400);
    await request("DELETE", `/api/rooms/${roomId}/invites/${(secondInvite.json as { id: number }).id}`, { cookie: owner });
    const reused = await request("POST", "/api/rooms/join", {
      cookie: stranger,
      body: { code: (secondInvite.json as { code: string }).code },
    });
    assert.equal(reused.status, 400);
    assert.equal(hashOpaqueSecret("room", (secondInvite.json as { code: string }).code).length, 64);

    let sawLimited = false;
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const limited = await request("POST", "/api/comp-codes/redeem", {
        cookie: owner,
        body: { code: `ARC-not-a-real-code-${attempt}` },
      });
      if (limited.status === 429) {
        sawLimited = true;
        break;
      }
    }
    assert.equal(sawLimited, true);
  });
});
