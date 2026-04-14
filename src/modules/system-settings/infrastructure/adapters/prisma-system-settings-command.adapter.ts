import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { SystemSettingsCommandPort } from '../../domain/ports/system-settings-command.port';
import { SystemSettingReadModel } from '../../domain/ports/system-settings-query.port';

@Injectable()
export class PrismaSystemSettingsCommandAdapter implements SystemSettingsCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async updateValueByName(input: { name: string; value: string | null }): Promise<SystemSettingReadModel> {
    return this.prisma.systemSetting.update({
      where: { name: input.name },
      data: {
        value: input.value,
      },
    });
  }
}
