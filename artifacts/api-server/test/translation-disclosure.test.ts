import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { TRANSLATION_DISCLOSURE } from "@workspace/config";
import { db, pool, sourcesTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import app from "../src/app.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const webRoot = path.join(root, "artifacts/archive-research-center");
const webRequire = createRequire(path.join(webRoot, "package.json"));
let server: http.Server;
let baseUrl = "";

async function request(
  method: string,
  pathname: string,
  options: { body?: unknown; cookie?: string } = {},
) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      ...(options.cookie ? { cookie: options.cookie } : {}),
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

function collectKeys(value: unknown, found: string[] = []): string[] {
  if (!value || typeof value !== "object") return found;
  for (const [key, child] of Object.entries(value)) {
    found.push(key);
    collectKeys(child, found);
  }
  return found;
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

test("translation API responses include the shared disclosure and no model names", async () => {
  const created = await request("POST", "/api/auth/register", {
    body: { email: "disclosure@example.com", password: "correct horse battery", displayName: "Disclosure" },
  });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  const cookie = sessionCookie(created.cookie);

  const [source] = await db.insert(sourcesTable).values({
    title: "Disclosure passage",
    sourceType: "primary",
    provenance: "Test shelf",
    confidence: "high",
    availability: "public_domain",
    excerpt: "A separate English layer.",
    tags: [],
  }).returning();

  const passage = await request("GET", `/api/sources/${source.id}`);
  assert.equal(passage.status, 200);
  const passageBody = passage.json as { excerpt: string; translationDisclosure: string };
  assert.equal(passageBody.excerpt, "A separate English layer.");
  assert.equal(passageBody.translationDisclosure, TRANSLATION_DISCLOSURE);

  const workspace = await request("POST", "/api/translations", {
    cookie,
    body: { sourceId: source.id },
  });
  assert.equal(workspace.status, 201, JSON.stringify(workspace.json));
  const translation = workspace.json as { id: number; translationDisclosure: string; literalTranslation: string | null };
  assert.equal(translation.translationDisclosure, TRANSLATION_DISCLOSURE);
  assert.equal(translation.literalTranslation, null);

  const loaded = await request("GET", `/api/translations?sourceId=${source.id}`, { cookie });
  assert.equal(loaded.status, 200);
  assert.equal((loaded.json as { translationDisclosure: string }).translationDisclosure, TRANSLATION_DISCLOSURE);

  const patched = await request("PATCH", `/api/translations/${translation.id}`, {
    cookie,
    body: { literalTranslation: "word for word" },
  });
  assert.equal(patched.status, 200);
  assert.equal((patched.json as { translationDisclosure: string }).translationDisclosure, TRANSLATION_DISCLOSURE);

  const list = await request("GET", "/api/translations/workspaces", { cookie });
  assert.equal(list.status, 200);
  const summaries = list.json as { preview: string; translationDisclosure: string }[];
  assert.equal(summaries.length, 1);
  assert.equal(summaries[0]?.preview, "word for word");
  assert.equal(summaries[0]?.translationDisclosure, TRANSLATION_DISCLOSURE);

  const payload = JSON.stringify({
    passage: passage.json,
    translation: patched.json,
    summaries: list.json,
  });
  const keys = collectKeys({ passage: passage.json, translation: patched.json, summaries: list.json });
  for (const key of ["model", "provider", "aiAssistance", "ai_assistance"]) {
    assert.equal(keys.includes(key), false, key);
  }
  assert.equal(/openai|anthropic|gemini|claude|\bgpt\b/i.test(payload), false);
});

test("disclosure renders in the translation workspace", async () => {
  const { renderToStaticMarkup } = webRequire("react-dom/server") as typeof import("react-dom/server");
  const { TranslationDisclosure } = await import("../../archive-research-center/src/components/translation-disclosure.tsx");
  const html = renderToStaticMarkup(TranslationDisclosure());
  assert.match(html, new RegExp(TRANSLATION_DISCLOSURE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(html, /data-testid="translation-disclosure"/);

  const componentSource = readFileSync(
    path.join(webRoot, "src/components/translation-disclosure.tsx"),
    "utf8",
  );
  assert.match(componentSource, /from "@workspace\/config"/);
  const workspaceSource = readFileSync(
    path.join(webRoot, "src/pages/translation-workspace.tsx"),
    "utf8",
  );
  assert.match(workspaceSource, /<TranslationDisclosure \/>/);
  assert.match(workspaceSource, /TRANSLATION_DISCLOSURE/);
  const passageSource = readFileSync(path.join(webRoot, "src/pages/source-detail.tsx"), "utf8");
  assert.match(passageSource, /<TranslationDisclosure \/>/);
});
