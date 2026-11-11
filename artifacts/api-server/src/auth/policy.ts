import type { SessionUser } from "./session";

/**
 * OPEN QUESTION: Jacqueline has not decided whether a signed-in researcher
 * without paid or comp access may be invited into a private room.
 * The default is members-only (paid entitlement, comp, or staff).
 * Set PRIVATE_ROOMS_ALLOW_FREE_GUESTS=1 to allow free accounts to join.
 */
export function privateRoomsAllowFreeGuests(): boolean {
  const raw = (process.env.PRIVATE_ROOMS_ALLOW_FREE_GUESTS ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function isModerator(user: { role: string } | null | undefined): boolean {
  return user?.role === "moderator" || user?.role === "admin";
}

/** Comp overrides billing. Staff can enter private rooms for safety work. */
export function canJoinPrivateRoom(user: SessionUser): boolean {
  if (user.entitlement === "comp" || user.entitlement === "paid") return true;
  if (user.role === "admin" || user.role === "moderator") return true;
  return privateRoomsAllowFreeGuests();
}

export function effectiveEntitlement(billing: string, compActive: boolean): SessionUser["entitlement"] {
  if (compActive) return "comp";
  return billing === "paid" ? "paid" : "free";
}
