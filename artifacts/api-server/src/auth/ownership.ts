import { and, eq, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";
import type { SessionUser } from "./session";

export function whereAll(...parts: Array<SQL | undefined>): SQL | undefined {
  const present = parts.filter((part): part is SQL => part !== undefined);
  if (present.length === 0) return undefined;
  if (present.length === 1) return present[0];
  return and(...present);
}

export function ownedBy(user: SessionUser, column: AnyColumn): SQL | undefined {
  return user.role === "admin" ? undefined : eq(column, user.id);
}
