import { ensureDatabase, createUser, findUserByIdentifier } from "../src/lib/server/data";
import { hashPassword } from "../src/lib/server/core";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const args = process.argv.slice(2);
  let username = args[0];
  let email = args[1];
  let password = args[2];
  let role = args[3] || "owner";

  if (!username || !email || !password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <username> <email> <password> [role]");
    process.exit(1);
  }

  try {
    await ensureDatabase();
    const existing = await findUserByIdentifier(username) || await findUserByIdentifier(email);

    if (existing) {
      console.log(`User '${existing.username}' already exists. Updating role to '${role}' and updating password...`);
      const newHash = await hashPassword(password);
      await db.update(users).set({
        role: role as "owner" | "admin" | "member",
        passwordHash: newHash,
      }).where(eq(users.id, existing.id));
      console.log(`Successfully updated admin user '${existing.username}'!`);
    } else {
      const user = await createUser({
        username,
        email,
        password,
        role: role as "owner" | "admin" | "member",
      });
      console.log(`Successfully created ${user.role} user '${user.username}' (${user.email})!`);
    }
    process.exit(0);
  } catch (err: any) {
    console.error("Error creating/updating admin user:", err?.message || err);
    process.exit(1);
  }
}

main();
