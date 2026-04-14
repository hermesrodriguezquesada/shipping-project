import { Module } from '@nestjs/common';
import { SYSTEM_SETTINGS_COMMAND_PORT, SYSTEM_SETTINGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { SystemSettingValueValidatorService } from './application/services/system-setting-value-validator.service';
import { AdminGetSystemSettingUseCase } from './application/use-cases/admin-get-system-setting.usecase';
import { AdminListSystemSettingsUseCase } from './application/use-cases/admin-list-system-settings.usecase';
import { AdminUpdateSystemSettingValueUseCase } from './application/use-cases/admin-update-system-setting-value.usecase';
import { PrismaSystemSettingsCommandAdapter } from './infrastructure/adapters/prisma-system-settings-command.adapter';
import { PrismaSystemSettingsQueryAdapter } from './infrastructure/adapters/prisma-system-settings-query.adapter';
import { SystemSettingsResolver } from './presentation/graphql/resolvers/system-settings.resolver';

@Module({
  providers: [
    PrismaSystemSettingsCommandAdapter,
    PrismaSystemSettingsQueryAdapter,
    { provide: SYSTEM_SETTINGS_QUERY_PORT, useExisting: PrismaSystemSettingsQueryAdapter },
    { provide: SYSTEM_SETTINGS_COMMAND_PORT, useExisting: PrismaSystemSettingsCommandAdapter },
    SystemSettingValueValidatorService,
    AdminListSystemSettingsUseCase,
    AdminGetSystemSettingUseCase,
    AdminUpdateSystemSettingValueUseCase,
    SystemSettingsResolver,
  ],
  exports: [SYSTEM_SETTINGS_QUERY_PORT, SYSTEM_SETTINGS_COMMAND_PORT],
})
export class SystemSettingsModule {}
