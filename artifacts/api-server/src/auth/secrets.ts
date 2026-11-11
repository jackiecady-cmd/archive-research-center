import { createHash, randomBytes } from "node:crypto";

export type SecretPurpose = "comp" | "room" | "service";

/** High-entropy codes are stored as a SHA-256 digest. An optional pepper is mixed in when set. */
export function hashOpaqueSecret(purpose: SecretPurpose, value: string): string {
  const pepper = process.env.COMP_CODE_PEPPER ?? "";
  return createHash("sha256")
    .update(purpose)
    .update("\0")
    .update(pepper)
    .update("\0")
    .update(value)
    .digest("hex");
}

export function newOpaqueCode(purpose: SecretPurpose): { secret: string; hint: string; hash: string } {
  const prefix = purpose === "comp" ? "ARC" : purpose === "room" ? "ROOM" : "SVC";
  const raw = randomBytes(18).toString("base64url");
  const secret = `${prefix}-${raw}`;
  return {
    secret,
    hint: raw.slice(-4),
    hash: hashOpaqueSecret(purpose, secret),
  };
}
