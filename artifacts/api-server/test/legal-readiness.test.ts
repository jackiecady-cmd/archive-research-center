import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import {
  hasBracketedPlaceholder,
  isCitationOnly,
  legalPageIsPublic,
  legalPagesLive,
  readRetention,
  retentionWarnings,
  stripNonPublicSections,
} from "@workspace/config/legal";
import { db, pool, sourcesTable, usersTable } from "@workspace/db";
import app from "../src/app.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
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

before(async () => {
  delete process.env.LEGAL_PAGES_LIVE;
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
  server = await new Promise<http.Server>((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  delete process.env.LEGAL_PAGES_LIVE;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await pool.end();
});

test("bracketed legal drafts stay unpublished and retention periods are not invented", () => {
  assert.equal(legalPagesLive({}), false);
  assert.equal(legalPagesLive({ LEGAL_PAGES_LIVE: "1" }), true);
  const terms = readFileSync(path.join(root, "legal/terms-of-use.md"), "utf8");
  const notices = readFileSync(path.join(root, "legal/open-source-notices.md"), "utf8");
  assert.equal(hasBracketedPlaceholder(terms), true);
  assert.equal(hasBracketedPlaceholder("[EFFECTIVE DATE]"), true);
  assert.equal(hasBracketedPlaceholder("See the [Copyright and DMCA Policy](/legal/copyright)."), false);
  assert.equal(legalPageIsPublic(terms, { LEGAL_PAGES_LIVE: "1" }), false);
  assert.equal(legalPageIsPublic(notices, { LEGAL_PAGES_LIVE: "1" }), true);
  assert.equal(legalPageIsPublic(notices, {}), false);
  for (const item of readRetention({})) assert.equal(item.value, null);
  assert.equal(retentionWarnings({}).length, 4);
  assert.equal(readRetention({ RETENTION_FORUM_POSTS: "counsel has not set this" })[2]?.value, "counsel has not set this");

  const license = readFileSync(path.join(root, "LICENSE"), "utf8");
  assert.match(license, /pending/i);
  assert.match(license, /All rights reserved/);
  assert.equal(/^MIT License/m.test(license), false);
  assert.equal(/^Apache License/m.test(license), false);

  assert.equal(isCitationOnly({ availability: "restricted" }), true);
  assert.equal(isCitationOnly({ repositoryAccessStatus: "catalog_only" }), true);
  assert.equal(isCitationOnly({ availability: "blocked" }), true);
  assert.equal(isCitationOnly({ rightsStatement: "This archive holds a link-only catalogue reference." }), true);
  assert.equal(isCitationOnly({ provenance: "Tablet photographed for CDLI." }), true);
  assert.equal(isCitationOnly({
    availability: "public_domain",
    rightsStatement: "English is public domain. Greek is omitted because the transcription is CC BY-NC-SA. No manuscript image is included.",
  }), false);

  const seed = readFileSync(path.join(root, "lib/db/src/seed.ts"), "utf8");
  assert.equal(seed.includes("cdli.ucla.edu"), false);
  assert.equal(/https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)/i.test(seed), false);
  assert.equal(seed.includes('repositoryAccessStatus: "catalog_only"'), true);
  assert.equal(seed.includes("archives.gov/research/census/1880"), false);
  assert.equal(seed.includes('slug: "census"'), false);
  const termsFile = readFileSync(path.join(root, "legal/terms-of-use.md"), "utf8");
  assert.equal(termsFile.includes("Fee amounts are omitted on purpose until the owner supplies the fee schedule."), true);
  assert.equal(termsFile.includes("Grok conversation"), false);
  assert.equal(stripNonPublicSections(termsFile).includes("Drafting notes"), false);
  assert.equal(stripNonPublicSections(termsFile).includes("attorney-packet"), false);
  const html = readFileSync(path.join(root, "artifacts/archive-research-center/index.html"), "utf8");
  const css = readFileSync(path.join(root, "artifacts/archive-research-center/src/index.css"), "utf8");
  assert.equal(html.includes("fonts.googleapis.com"), false);
  assert.equal(html.includes("fonts.gstatic.com"), false);
  assert.equal(css.includes("fonts.googleapis.com"), false);
  assert.equal(css.includes("fonts.gstatic.com"), false);
  const workspace = readFileSync(path.join(root, "artifacts/archive-research-center/src/pages/translation-workspace.tsx"), "utf8");
  assert.match(workspace, /payload\.citationOnly \|\| citationOnly/);
  const footer = readFileSync(path.join(root, "artifacts/archive-research-center/src/components/site-footer.tsx"), "utf8");
  assert.match(footer, /TRANSLATION_DISCLOSURE/);
  assert.equal(footer.includes("The English translations here are AI-generated"), false);
});

test("legal pages and citation-only export follow the public gate", async () => {
  delete process.env.LEGAL_PAGES_LIVE;
  const hidden = await request("GET", "/api/legal/pages");
  assert.equal(hidden.status, 200);
  assert.equal((hidden.json as { pages: unknown[] }).pages.length, 0);
  const termsHidden = await request("GET", "/api/legal/pages/terms");
  assert.equal(termsHidden.status, 404);

  const registered = await request("POST", "/api/auth/register", {
    body: { email: "ada.legal@example.com", password: "correct horse battery", displayName: "Ada Legal" },
  });
  assert.equal(registered.status, 201);
  const admin = sessionCookie(registered.cookie);
  await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.email, "ada.legal@example.com"));
  const preview = await request("GET", "/api/legal/pages/terms", { cookie: admin });
  assert.equal(preview.status, 200);
  const previewBody = preview.json as { preview: boolean; public: boolean; body: string };
  assert.equal(previewBody.preview, true);
  assert.equal(previewBody.public, false);
  assert.equal(previewBody.body.includes("[EFFECTIVE DATE]"), true);

  process.env.LEGAL_PAGES_LIVE = "1";
  const stillHidden = await request("GET", "/api/legal/pages/terms");
  assert.equal(stillHidden.status, 404);
  const notices = await request("GET", "/api/legal/pages/open-source");
  assert.equal(notices.status, 200);
  const noticeBody = notices.json as { public: boolean; body: string };
  assert.equal(noticeBody.public, true);
  assert.equal(noticeBody.body.includes("Playfair Display"), true);
  assert.equal(noticeBody.body.includes("SIL Open Font License"), true);
  const listed = await request("GET", "/api/legal/pages");
  const slugs = (listed.json as { pages: { slug: string; public: boolean }[] }).pages.map((page) => page.slug);
  assert.equal(slugs.includes("terms"), false);
  assert.equal(slugs.includes("open-source"), true);
  delete process.env.LEGAL_PAGES_LIVE;
  assert.equal((await request("GET", "/api/legal/pages/open-source")).status, 404);

  const [restricted] = await db.insert(sourcesTable).values({
    title: "Restricted holding",
    sourceType: "primary",
    provenance: "Holding institution",
    confidence: "high",
    availability: "restricted",
    repositoryAccessStatus: "catalog_only",
    rightsStatement: "Link-only catalogue reference.",
    excerpt: "FULL TEXT LINE THAT MUST NOT BE EXPORTED",
    originalLanguageText: "SOURCE LINE THAT MUST NOT BE EXPORTED",
    externalUrl: "https://example.test/catalogue",
    tags: [],
  }).returning();
  const [open] = await db.insert(sourcesTable).values({
    title: "Open holding",
    sourceType: "primary",
    provenance: "Public shelf",
    confidence: "high",
    availability: "public_domain",
    rightsStatement: "Public domain.",
    excerpt: "A public-domain sentence.",
    tags: [],
  }).returning();
  const [licensed] = await db.insert(sourcesTable).values({
    title: "Licensed transcription",
    sourceType: "primary",
    provenance: "CDLI tablet photograph",
    confidence: "medium",
    availability: "open_access",
    rightsStatement: "Transcription is CC BY-NC-SA. No image is included.",
    excerpt: "CDLI FULL TRANSLITERATION",
    originalLanguageText: "CDLI SOURCE SIGNS",
    tags: [],
  }).returning();

  const restrictedDetail = await request("GET", `/api/sources/${restricted.id}`);
  const restrictedRecord = restrictedDetail.json as { excerpt: string | null; originalLanguageText: string | null };
  assert.equal(restrictedRecord.excerpt, null);
  assert.equal(restrictedRecord.originalLanguageText, null);
  const catalog = await request("GET", "/api/sources");
  const catalogItems = (catalog.json as { items: { id: number; excerpt: string | null; originalLanguageText: string | null }[] }).items;
  const listedRestricted = catalogItems.find((item) => item.id === restricted.id);
  assert.equal(listedRestricted?.excerpt, null);
  assert.equal(listedRestricted?.originalLanguageText, null);

  const restrictedExport = await request("GET", `/api/sources/${restricted.id}/export`);
  assert.equal(restrictedExport.status, 200);
  const restrictedJson = restrictedExport.json as { citationOnly: boolean; externalUrl: string | null };
  assert.equal(restrictedJson.citationOnly, true);
  assert.equal(restrictedJson.externalUrl, "https://example.test/catalogue");
  const restrictedText = JSON.stringify(restrictedExport.json);
  assert.equal(restrictedText.includes("FULL TEXT LINE"), false);
  assert.equal(restrictedText.includes("SOURCE LINE"), false);

  const openExport = await request("GET", `/api/sources/${open.id}/export`);
  assert.equal((openExport.json as { citationOnly: boolean }).citationOnly, false);
  assert.equal((openExport.json as { excerpt: string }).excerpt, "A public-domain sentence.");

  const licensedSource = await request("GET", `/api/sources/${licensed.id}`);
  const licensedBody = licensedSource.json as { excerpt: string | null; originalLanguageText: string | null };
  assert.equal(licensedBody.excerpt, null);
  assert.equal(licensedBody.originalLanguageText, null);
  const catalogAfter = await request("GET", "/api/sources");
  const listedLicensed = (catalogAfter.json as { items: { id: number; excerpt: string | null; originalLanguageText: string | null }[] }).items
    .find((item) => item.id === licensed.id);
  assert.equal(listedLicensed?.excerpt, null);
  assert.equal(listedLicensed?.originalLanguageText, null);
  const licensedExport = await request("GET", `/api/sources/${licensed.id}/export`);
  assert.equal((licensedExport.json as { citationOnly: boolean }).citationOnly, true);
  assert.equal(JSON.stringify(licensedExport.json).includes("CDLI FULL"), false);

  const plans = await request("GET", "/api/membership/plans");
  const plansText = JSON.stringify(plans.json);
  assert.equal(/vatican|license-restricted|restricted holdings/i.test(plansText), false);
  assert.equal(plansText.includes("priceUsd"), false);
  assert.equal(plansText.includes("price"), false);
  assert.equal(/\$\d/.test(plansText), false);
  assert.equal(plansText.includes("Early access to new collections"), false);
  const subscribe = await request("POST", "/api/membership/subscribe", { cookie: admin, body: { planId: "scholar" } });
  assert.equal(subscribe.status, 501);

  const noticesPath = path.join(root, "legal/open-source-notices.md");
  const originalNotices = readFileSync(noticesPath, "utf8");
  try {
    writeFileSync(noticesPath, `${originalNotices}\n### Drafting notes\n\nSECRET DRAFTING NOTE\n`);
    process.env.LEGAL_PAGES_LIVE = "1";
    const publicNotices = await request("GET", "/api/legal/pages/open-source");
    assert.equal(publicNotices.status, 200);
    assert.equal(JSON.stringify(publicNotices.json).includes("SECRET DRAFTING NOTE"), false);
    assert.equal(JSON.stringify(publicNotices.json).includes("Drafting notes"), false);
    const adminNotices = await request("GET", "/api/legal/pages/open-source", { cookie: admin });
    assert.equal(JSON.stringify(adminNotices.json).includes("SECRET DRAFTING NOTE"), true);
  } finally {
    writeFileSync(noticesPath, originalNotices);
    delete process.env.LEGAL_PAGES_LIVE;
  }

  const adminTerms = await request("GET", "/api/legal/pages/terms", { cookie: admin });
  assert.equal((adminTerms.json as { body: string }).body.includes("Drafting notes"), true);
  const publicTerms = await request("GET", "/api/legal/pages/terms");
  assert.equal(publicTerms.status, 404);
});
