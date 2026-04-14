import { SystemSettingType } from '@prisma/client';

export interface SystemSettingReadModel {
  id: string;
  name: string;
  type: SystemSettingType;
  value: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSettingsQueryPort {
  listAll(): Promise<SystemSettingReadModel[]>;
  findByName(name: string): Promise<SystemSettingReadModel | null>;
}
