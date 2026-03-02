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
    await prisma.paymentMethod.upsert({
      where: { code: 'ZELLE' },
      update: { enabled: true, name: 'Zelle' },
      create: { code: 'ZELLE', name: 'Zelle', enabled: true },
    });
    await prisma.paymentMethod.upsert({
      where: { code: 'IBAN' },
      update: { enabled: true, name: 'IBAN' },
      create: { code: 'IBAN', name: 'IBAN', enabled: true },
    });
    await prisma.paymentMethod.upsert({
      where: { code: 'STRIPE' },
      update: { enabled: true, name: 'Stripe' },
      create: { code: 'STRIPE', name: 'Stripe', enabled: true },
    });

    const receptionMethods = [
      ['USD_CASH', 'USD Cash'],
      ['CUP_CASH', 'CUP Cash'],
      ['CUP_TRANSFER', 'CUP Transfer'],
      ['MLC', 'MLC'],
      ['USD_CLASSIC', 'USD Classic'],
    ] as const;

    for (const [code, name] of receptionMethods) {
      await prisma.receptionMethodCatalog.upsert({
        where: { code },
        update: { enabled: true, name },
        create: { code, name, enabled: true },
      });
    }

    const currencies = [
      ['USD', 'US Dollar'],
      ['EUR', 'Euro'],
      ['CUP', 'Cuban Peso'],
      ['MLC', 'Moneda Libremente Convertible'],
    ] as const;

    for (const [code, name] of currencies) {
      await prisma.currencyCatalog.upsert({
        where: { code },
        update: { enabled: true, name },
        create: { code, name, enabled: true },
      });
    }

    const usdCurrency = await prisma.currencyCatalog.findUnique({ where: { code: 'USD' }, select: { id: true } });
    const eurCurrency = await prisma.currencyCatalog.findUnique({ where: { code: 'EUR' }, select: { id: true } });

    if (usdCurrency) {
      const usdPersonV1 = await prisma.commissionRule.findFirst({
        where: {
          currencyId: usdCurrency.id,
          holderType: 'PERSON',
          version: 1,
        },
        select: { id: true },
      });

      if (!usdPersonV1) {
        await prisma.commissionRule.create({
          data: {
            currencyId: usdCurrency.id,
            holderType: 'PERSON',
            version: 1,
            thresholdAmount: '100',
            percentRate: '0.05',
            flatFee: '5',
            enabled: true,
          },
        });
      }
    }

    if (eurCurrency) {
      const eurPersonV1 = await prisma.commissionRule.findFirst({
        where: {
          currencyId: eurCurrency.id,
          holderType: 'PERSON',
          version: 1,
        },
        select: { id: true },
      });

      if (!eurPersonV1) {
        await prisma.commissionRule.create({
          data: {
            currencyId: eurCurrency.id,
            holderType: 'PERSON',
            version: 1,
            thresholdAmount: '100',
            percentRate: '0.05',
            flatFee: '5',
            enabled: true,
          },
        });
      }
    }

    if (usdCurrency) {
      const disabledDeliveryExample = await prisma.deliveryFeeRule.findFirst({
        where: {
          currencyId: usdCurrency.id,
          country: 'CU',
          region: null,
          city: null,
        },
        select: { id: true },
      });

      if (!disabledDeliveryExample) {
        await prisma.deliveryFeeRule.create({
          data: {
            currencyId: usdCurrency.id,
            country: 'CU',
            amount: '0',
            enabled: false,
          },
        });
      }
    }

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
