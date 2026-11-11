/**
 * Promote an existing account. There is no built-in password.
 *
 *   ADMIN_EMAIL=you@example.com pnpm db:set-role
 *   pnpm db:set-role -- you@example.com editor
 *
 * The account must already be registered. ADMIN_EMAIL also grants admin
 * when that address registers or signs in.
 */
import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { usersTable, USER_ROLES, type UserRole } from "./schema/users.js";

const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const role = (process.argv[3] ?? process.env.ROLE ?? "admin").trim().toLowerCase();

function isRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

if (!email) {
  console.error(
    "Set ADMIN_EMAIL or pass an email. Example: ADMIN_EMAIL=you@example.com pnpm db:set-role",
  );
  process.exit(1);
}

if (!isRole(role)) {
  console.error("Role must be one of: user, editor, moderator, admin.");
  process.exit(1);
}

const [updated] = await db
  .update(usersTable)
  .set({ role })
  .where(eq(usersTable.email, email))
  .returning({ id: usersTable.id, email: usersTable.email, role: usersTable.role });

if (!updated) {
  console.error(`No account found for ${email}. Register that email first, then run this command again.`);
  process.exit(1);
}

console.log(`Updated ${updated.email} (#${updated.id}) to role ${updated.role}.`);
process.exit(0);
