import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { SystemSettingsQueryPort, SystemSettingReadModel } from '../../domain/ports/system-settings-query.port';

@Injectable()
export class PrismaSystemSettingsQueryAdapter implements SystemSettingsQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(): Promise<SystemSettingReadModel[]> {
    return this.prisma.systemSetting.findMany({
      orderBy: [{ name: 'asc' }],
    });
  }

  async findByName(name: string): Promise<SystemSettingReadModel | null> {
    return this.prisma.systemSetting.findUnique({
      where: { name },
    });
  }
}
