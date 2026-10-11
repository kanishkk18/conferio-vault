/**
 * Promotes a user to admin by email. Run with:
 *   pnpm --filter @securevault/database promote-admin someone@example.com
 *
 * The user must already have a normal account (registered via the web
 * app's /register page) — this script only flips their role, it doesn't
 * create accounts.
 */
import { prisma } from "./client";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: pnpm --filter @securevault/database promote-admin <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No account found for ${email}. They need to register at /register first.`);
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`${email} is already an admin.`);
    return;
  }

  await prisma.user.update({ where: { email }, data: { role: "admin" } });
  console.log(`✅ ${email} is now an admin. They can sign in at the admin app's /login.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
