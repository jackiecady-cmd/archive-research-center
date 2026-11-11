import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request, Response } from "express";
import { sessionCookieOptions } from "../src/auth/session.ts";
import {
  apiPath,
  createRateLimiter,
  csrfProtection,
  escapeLike,
  isPublicRead,
  parseListLimit,
  parseListPage,
} from "../src/lib/security.ts";

test("public catalog reads stay open and private routes do not", () => {
  assert.equal(isPublicRead("GET", "/healthz"), true);
  assert.equal(isPublicRead("GET", "/sources"), true);
  assert.equal(isPublicRead("GET", "/sources/stats"), true);
  assert.equal(isPublicRead("GET", "/sources/12"), true);
  assert.equal(isPublicRead("POST", "/sources"), false);
  assert.equal(isPublicRead("GET", "/collections/greco-roman"), true);
  assert.equal(isPublicRead("GET", "/repositories/vatican-apostolic-library"), true);
  assert.equal(isPublicRead("GET", "/membership/plans"), true);
  assert.equal(isPublicRead("GET", "/membership/current"), false);
  assert.equal(isPublicRead("GET", "/concierge/paths"), false);
  assert.equal(isPublicRead("POST", "/concierge/recommend"), false);
  assert.equal(isPublicRead("GET", "/forum/threads"), true);
  assert.equal(isPublicRead("GET", "/forum/threads/4"), true);
  assert.equal(isPublicRead("GET", "/forum/categories"), true);
  assert.equal(isPublicRead("POST", "/forum/threads"), false);
  assert.equal(isPublicRead("GET", "/rooms"), false);
  assert.equal(isPublicRead("GET", "/research-projects"), false);
  assert.equal(apiPath({ originalUrl: "/api/sources/stats?q=a_b" } as Request), "/sources/stats");
});

test("search helpers escape LIKE metacharacters and bound pagination", () => {
  assert.equal(escapeLike("100%_a\\b"), "100\\%\\_a\\\\b");
  assert.equal(parseListPage(undefined), 1);
  assert.equal(parseListPage("2"), 2);
  assert.equal(parseListPage(0), null);
  assert.equal(parseListPage(-1), null);
  assert.equal(parseListLimit(undefined, 20), 20);
  assert.equal(parseListLimit(50, 20), 50);
  assert.equal(parseListLimit(51, 20), null);
});

test("session cookies are httpOnly and SameSite=Lax, and Secure only in production", () => {
  const dev = sessionCookieOptions("development");
  const prod = sessionCookieOptions("production");
  assert.equal(dev.httpOnly, true);
  assert.equal(dev.sameSite, "lax");
  assert.equal(dev.secure, false);
  assert.equal(prod.secure, true);
});

test("state-changing requests from another origin are rejected", () => {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
    },
  };
  let nextCalled = false;
  csrfProtection(
    { method: "POST", get: (name: string) => (name === "origin" ? "https://evil.example" : undefined) } as Request,
    res as unknown as Response,
    () => {
      nextCalled = true;
    },
  );
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test("auth-style rate limit keys by IP", () => {
  const limit = createRateLimiter({ windowMs: 60_000, max: 2 });
  const calls: number[] = [];
  for (let i = 0; i < 3; i += 1) {
    const res = {
      statusCode: 200,
      body: undefined as unknown,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(body: unknown) {
        this.body = body;
      },
      setHeader() {},
    };
    limit(
      { ip: "203.0.113.5", socket: { remoteAddress: "203.0.113.5" } } as Request,
      res as unknown as Response,
      () => {
        calls.push(res.statusCode);
      },
    );
    calls.push(res.statusCode);
  }
  assert.equal(calls.filter((code) => code === 429).length >= 1, true);
});
