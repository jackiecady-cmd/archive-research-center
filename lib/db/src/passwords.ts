import argon2 from "argon2";

const testing = process.env.NODE_ENV === "test";

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: testing ? 4096 : 19456,
    timeCost: testing ? 1 : 2,
    parallelism: 1,
  });
}

export function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}
