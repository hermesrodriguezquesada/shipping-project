import { Inject, Injectable } from '@nestjs/common';
import { SYSTEM_SETTINGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { SystemSettingReadModel, SystemSettingsQueryPort } from '../../domain/ports/system-settings-query.port';

@Injectable()
export class AdminListSystemSettingsUseCase {
  constructor(
    @Inject(SYSTEM_SETTINGS_QUERY_PORT)
    private readonly systemSettingsQuery: SystemSettingsQueryPort,
  ) {}

  async execute(): Promise<SystemSettingReadModel[]> {
    return this.systemSettingsQuery.listAll();
  }
}
