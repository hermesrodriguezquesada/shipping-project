import { registerEnumType } from '@nestjs/graphql';
import { SystemSettingType } from '@prisma/client';

registerEnumType(SystemSettingType, {
  name: 'SystemSettingType',
});
