import { PrismaClient, Role, SystemSettingType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// UUIDs v4 estables para las monedas del catálogo base.
// Formato válido: versión 4 (3er grupo empieza con '4') + variante RFC 4122 (4to grupo empieza con '8').
// Reemplazan los IDs no estándar que generaba la migration original (00000000-0000-0000-0000-0000000002XX).
const CURRENCY_SEED_IDS = {
  USD: '11111111-1111-4111-8111-111111111111',
  EUR: '22222222-2222-4222-8222-222222222222',
  CUP: '33333333-3333-4333-8333-333333333333',
  MLC: '44444444-4444-4444-8444-444444444444',
} as const;

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

    // Corregir IDs no estándar creados por la migration original.
    // ON UPDATE CASCADE en las FKs propaga el cambio a todas las tablas hijas automáticamente.
    // Se castea id::text para la comparación porque Prisma envía el parámetro como text.
    for (const [code, newId] of Object.entries(CURRENCY_SEED_IDS)) {
      await prisma.$executeRaw`
        UPDATE "CurrencyCatalog"
        SET id = ${newId}::uuid
        WHERE code = ${code}
          AND id::text != ${newId}
      `;
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
        create: { id: CURRENCY_SEED_IDS[code], code, name, enabled: true },
      });
    }

    const receptionMethods = [
      ['USD_CASH', 'USD Cash', 'USD', 'CASH'],
      ['CUP_CASH', 'CUP Cash', 'CUP', 'CASH'],
      ['CUP_TRANSFER', 'CUP Transfer', 'CUP', 'TRANSFER'],
      ['MLC', 'MLC', 'MLC', 'TRANSFER'],
      ['USD_CLASSIC', 'USD Classic', 'USD', 'TRANSFER'],
    ] as const;

    for (const [code, name, currencyCode, method] of receptionMethods) {
      await prisma.receptionMethodCatalog.upsert({
        where: { code },
        update: {
          enabled: true,
          name,
          method,
          currency: { connect: { code: currencyCode } },
        },
        create: {
          code,
          name,
          enabled: true,
          method,
          currency: { connect: { code: currencyCode } },
        },
      });
    }

    const systemSettings = [
      {
        name: 'CONTACT_WHATSAPP_CHANNEL',
        type: SystemSettingType.URL,
        value: 'https://whatsapp.com/channel/0029VbBohmQ3AzNYEWUuTt2d',
      },
      {
        name: 'CONTACT_PHONE_NUMBER1',
        type: SystemSettingType.STRING,
        value: '+971543138837',
      },
      {
        name: 'CONTACT_PHONE_NUMBER2',
        type: SystemSettingType.STRING,
        value: null,
      },
      {
        name: 'CONTACT_EMAIL',
        type: SystemSettingType.EMAIL,
        value: 'resiliencebrothersfz@gmail.com',
      },
      {
        name: 'REMITTANCE_ENABLED',
        type: SystemSettingType.BOOLEAN,
        value: 'true',
      },
      {
        name: 'NOTIF_USER_EXCEEDS_TRANSACTIONS_PER_DAY',
        type: SystemSettingType.NUMBER,
        value: '10',
      },
      {
        name: 'NOTIF_TRANSACTIONS_OVER_AMOUNT',
        type: SystemSettingType.NUMBER,
        value: '10000',
      },
      {
        name: 'EXTERNAL_CHANNEL_SHARED_SECRET',
        type: SystemSettingType.PASSWORD,
        value: null,
      },
      {
        name: 'CASH_PICKUP_ADDRESS',
        type: SystemSettingType.STRING,
        value: 'TBD - Contact admin for address',
      },
      {
        name: 'CASH_DELIVERY_FEE_USD',
        type: SystemSettingType.NUMBER,
        value: '10',
      },
      {
        name: 'CASH_DELIVERY_MIN_AMOUNT_USD',
        type: SystemSettingType.NUMBER,
        value: '1000',
      },
      {
        name: 'REMITTANCE_AMOUNT_MIN',
        type: SystemSettingType.NUMBER,
        value: '1',
      },
      {
        name: 'REMITTANCE_AMOUNT_MAX',
        type: SystemSettingType.NUMBER,
        value: '10000',
      },
    ] as const;

    for (const setting of systemSettings) {
      await prisma.systemSetting.upsert({
        where: { name: setting.name },
        update: {
          type: setting.type,
        },
        create: {
          name: setting.name,
          type: setting.type,
          value: setting.value,
        },
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
