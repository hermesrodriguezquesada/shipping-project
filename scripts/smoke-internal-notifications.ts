import 'dotenv/config';
import { InternalNotificationType } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

const prisma = new PrismaService();

async function main(): Promise<void> {
  await prisma.onModuleInit();

  let user = await prisma.user.findFirst({
    where: { isDeleted: false },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: `smoke-notifications-${Date.now()}@local.test`,
        passwordHash: 'smoke_password_hash',
      },
      select: { id: true, email: true },
    });
  }

  const created = await prisma.internalNotification.create({
    data: {
      userId: user.id,
      type: InternalNotificationType.NEW_REMITTANCE,
      referenceId: `smoke-remittance-${Date.now()}`,
    },
  });

  const unreadList = await prisma.internalNotification.findMany({
    where: { userId: user.id, isRead: false },
    orderBy: { createdAt: 'desc' },
    skip: 0,
    take: 10,
  });

  if (!unreadList.some((item) => item.id === created.id)) {
    throw new Error('Caso A/B fallido: la notificacion creada no aparece en el listado unread');
  }

  const marked = await prisma.internalNotification.updateMany({
    where: { id: created.id, userId: user.id, isRead: false },
    data: { isRead: true },
  });

  if (marked.count !== 1) {
    throw new Error('Caso C fallido: no se pudo marcar la notificacion como leida');
  }

  const updated = await prisma.internalNotification.findUnique({ where: { id: created.id } });

  if (!updated || !updated.isRead) {
    throw new Error('Caso D fallido: la notificacion no quedo en isRead=true');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId: user.id,
        notificationId: created.id,
        unreadCountForUser: unreadList.length,
        markedCount: marked.count,
        finalIsRead: updated.isRead,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error('Smoke internal notifications failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.onModuleDestroy();
  });
