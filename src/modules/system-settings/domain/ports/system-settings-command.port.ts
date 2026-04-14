import { SystemSettingReadModel } from './system-settings-query.port';

export interface SystemSettingsCommandPort {
  updateValueByName(input: { name: string; value: string | null }): Promise<SystemSettingReadModel>;
}
