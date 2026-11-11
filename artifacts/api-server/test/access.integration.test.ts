import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import app from "../src/app.ts";
import { db, pool, sourcesTable, translationsTable } from "@workspace/db";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
let server: http.Server;
let baseUrl = "";

async function request(
  method: string,
  pathname: string,
  options: { body?: unknown; cookie?: string; origin?: string } = {},
) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      ...(options.cookie ? { cookie: options.cookie } : {}),
      ...(options.origin ? { origin: options.origin } : {}),
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

before(async () => {
  execFileSync(
    "pnpm",
    ["--filter", "@workspace/db", "exec", "drizzle-kit", "push", "--force", "--config", "./drizzle.config.ts"],
    { cwd: root, env: process.env, stdio: "inherit" },
  );
  await db.execute(sql`
    TRUNCATE TABLE
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

describe("authenticated API", { concurrency: 1 }, () => {
test("register, current user, logout, and field errors", async () => {
  const weak = await request("POST", "/api/auth/register", {
    body: { email: "short@example.com", password: "short", displayName: "Short" },
  });
  assert.equal(weak.status, 400);
  const weakBody = weak.json as { fieldErrors?: { password?: string[] } };
  assert.ok(weakBody.fieldErrors?.password?.length);

  const created = await request("POST", "/api/auth/register", {
    body: { email: "Ada@Example.com", password: "correct horse battery", displayName: "Ada Lovelace" },
  });
  assert.equal(created.status, 201);
  assert.match(created.cookie, /HttpOnly/i);
  assert.match(created.cookie, /SameSite=Lax/i);
  assert.doesNotMatch(created.cookie, /Secure/i);
  const user = created.json as { email: string; displayName: string; role: string; passwordHash?: string };
  assert.equal(user.email, "ada@example.com");
  assert.equal(user.displayName, "Ada Lovelace");
  assert.equal(user.role, "user");
  assert.equal(user.passwordHash, undefined);

  const cookie = sessionCookie(created.cookie);
  const me = await request("GET", "/api/auth/me", { cookie });
  assert.equal(me.status, 200);
  assert.equal((me.json as { email: string }).email, "ada@example.com");

  const loggedOut = await request("POST", "/api/auth/logout", { cookie });
  assert.equal(loggedOut.status, 204);
  const afterLogout = await request("GET", "/api/auth/me", { cookie });
  assert.equal(afterLogout.status, 401);

  const anonymous = await request("GET", "/api/healthz");
  assert.equal(anonymous.status, 200);
  const catalog = await request("GET", "/api/sources");
  assert.equal(catalog.status, 200);
  const blocked = await request("POST", "/api/sources", {
    body: { title: "Nope", sourceType: "primary", provenance: "x", confidence: "high", availability: "public_domain" },
  });
  assert.equal(blocked.status, 401);
  const crossSite = await request("POST", "/api/auth/login", {
    origin: "https://evil.example",
    body: { email: "ada@example.com", password: "correct horse battery" },
  });
  assert.equal(crossSite.status, 403);
});

test("research items are visible only to the owner", async () => {
  const ada = await request("POST", "/api/auth/login", {
    body: { email: "ada@example.com", password: "correct horse battery" },
  });
  const grace = await request("POST", "/api/auth/register", {
    body: { email: "grace@example.com", password: "another strong secret", displayName: "Grace Hopper" },
  });
  const adaCookie = sessionCookie(ada.cookie);
  const graceCookie = sessionCookie(grace.cookie);

  const project = await request("POST", "/api/research-projects", {
    cookie: adaCookie,
    body: { title: "Ada project", description: "private" },
  });
  assert.equal(project.status, 201);
  const projectId = (project.json as { id: number }).id;

  const hidden = await request("GET", `/api/research-projects/${projectId}`, { cookie: graceCookie });
  assert.equal(hidden.status, 404);

  const note = await request("POST", `/api/research-projects/${projectId}/notes`, {
    cookie: adaCookie,
    body: { title: "Keep", content: "Original", id: 999, projectId: 4242, createdAt: "2000-01-01T00:00:00.000Z" },
  });
  assert.equal(note.status, 201);
  const noteBody = note.json as { id: number; projectId: number; title: string };
  assert.notEqual(noteBody.id, 999);
  assert.equal(noteBody.projectId, projectId);

  const updated = await request("PATCH", `/api/research-projects/${projectId}/notes/${noteBody.id}`, {
    cookie: adaCookie,
    body: { title: "Revised", projectId: 4242, id: 1, createdAt: "1999-01-01T00:00:00.000Z" },
  });
  assert.equal(updated.status, 200);
  const updatedBody = updated.json as { title: string; projectId: number; id: number };
  assert.equal(updatedBody.title, "Revised");
  assert.equal(updatedBody.projectId, projectId);
  assert.equal(updatedBody.id, noteBody.id);

  const stolen = await request("DELETE", `/api/research-projects/${projectId}/notes/${noteBody.id}`, { cookie: graceCookie });
  assert.equal(stolen.status, 404);
  const stillThere = await request("GET", `/api/research-projects/${projectId}/notes`, { cookie: adaCookie });
  assert.equal(stillThere.status, 200);
  assert.equal((stillThere.json as unknown[]).length, 1);
});

test("translation workspaces are unique per user and source", async () => {
  const [source] = await db.insert(sourcesTable).values({
    title: "Workspace source",
    sourceType: "primary",
    provenance: "Test shelf",
    confidence: "high",
    availability: "public_domain",
    tags: [],
  }).returning();

  const ada = await request("POST", "/api/auth/login", {
    body: { email: "ada@example.com", password: "correct horse battery" },
  });
  const grace = await request("POST", "/api/auth/login", {
    body: { email: "grace@example.com", password: "another strong secret" },
  });
  const adaCookie = sessionCookie(ada.cookie);
  const graceCookie = sessionCookie(grace.cookie);

  const missing = await request("GET", `/api/translations?sourceId=${source.id}`, { cookie: adaCookie });
  assert.equal(missing.status, 404);
  const [{ count: beforeCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(translationsTable);
  assert.equal(beforeCount, 0);

  const created = await request("POST", "/api/translations", { cookie: adaCookie, body: { sourceId: source.id } });
  assert.equal(created.status, 201);
  const again = await request("POST", "/api/translations", { cookie: adaCookie, body: { sourceId: source.id } });
  assert.equal(again.status, 200);
  assert.equal((again.json as { id: number }).id, (created.json as { id: number }).id);

  const other = await request("POST", "/api/translations", { cookie: graceCookie, body: { sourceId: source.id } });
  assert.equal(other.status, 201);
  assert.notEqual((other.json as { id: number }).id, (created.json as { id: number }).id);

  const forbidden = await request("PATCH", `/api/translations/${(created.json as { id: number }).id}`, {
    cookie: graceCookie,
    body: { commentary: "not mine" },
  });
  assert.equal(forbidden.status, 404);

  const listed = await request("GET", "/api/translations/workspaces", { cookie: adaCookie });
  const rows = listed.json as Array<{ id: number }>;
  assert.equal(rows.some((row) => row.id === (other.json as { id: number }).id), false);

  const adaUser = ada.json as { id: number };
  await assert.rejects(() => db.insert(translationsTable).values({ userId: adaUser.id, sourceId: source.id }));
});

test("catalog writes require an editor and the first admin comes from ADMIN_EMAIL", async () => {
  process.env.ADMIN_EMAIL = "admin@example.com";
  const admin = await request("POST", "/api/auth/register", {
    body: { email: "admin@example.com", password: "administrator secret", displayName: "Admin" },
  });
  assert.equal((admin.json as { role: string }).role, "admin");
  const adminCookie = sessionCookie(admin.cookie);
  const created = await request("POST", "/api/sources", {
    cookie: adminCookie,
    body: {
      title: "Editor source",
      sourceType: "primary",
      provenance: "Reading room",
      confidence: "medium",
      availability: "open_access",
      tags: ["one"],
    },
  });
  assert.equal(created.status, 201);

  const ada = await request("POST", "/api/auth/login", {
    body: { email: "ada@example.com", password: "correct horse battery" },
  });
  const denied = await request("PATCH", `/api/sources/${(created.json as { id: number }).id}`, {
    cookie: sessionCookie(ada.cookie),
    body: { provenance: "changed" },
  });
  assert.equal(denied.status, 403);

  const huge = await request("GET", "/api/sources?limit=1000&page=0");
  assert.equal(huge.status, 400);
  const hugeBody = huge.json as { fieldErrors?: Record<string, string[]> };
  assert.ok(hugeBody.fieldErrors?.limit || hugeBody.fieldErrors?.page);
});
});
