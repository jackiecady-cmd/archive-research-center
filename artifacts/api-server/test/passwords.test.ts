import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "@workspace/db/passwords";

test("argon2id hashes verify only the original password", async () => {
  const hash = await hashPassword("correct horse battery");
  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await verifyPassword(hash, "correct horse battery"), true);
  assert.equal(await verifyPassword(hash, "wrong horse battery"), false);
});
