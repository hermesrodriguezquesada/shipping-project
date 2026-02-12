import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    console.log('⚠️ ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not set, skipping admin seed');
    return;
  }

  // ✅ Prisma 7 + adapter-pg (igual que tu PrismaService)
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log('ℹ️ Admin already exists, skipping seed');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        roles: [Role.ADMIN],
        isActive: true,
        isDeleted: false,
      },
    });

    console.log(`✅ Admin seeded: ${email}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
