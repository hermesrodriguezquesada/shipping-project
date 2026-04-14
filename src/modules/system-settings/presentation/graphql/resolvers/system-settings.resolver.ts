import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role, SystemSettingType as PrismaSystemSettingType } from '@prisma/client';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { AdminGetSystemSettingUseCase } from 'src/modules/system-settings/application/use-cases/admin-get-system-setting.usecase';
import { AdminListSystemSettingsUseCase } from 'src/modules/system-settings/application/use-cases/admin-list-system-settings.usecase';
import { AdminUpdateSystemSettingValueUseCase } from 'src/modules/system-settings/application/use-cases/admin-update-system-setting-value.usecase';
import { SystemSettingReadModel } from 'src/modules/system-settings/domain/ports/system-settings-query.port';
import { AdminUpdateSystemSettingInput } from '../inputs/admin-update-system-setting.input';
import { SystemSettingObjectType } from '../types/system-setting.type';

@UseGuards(GqlAuthGuard)
@Resolver()
export class SystemSettingsResolver {
  constructor(
    private readonly listUseCase: AdminListSystemSettingsUseCase,
    private readonly getUseCase: AdminGetSystemSettingUseCase,
    private readonly updateUseCase: AdminUpdateSystemSettingValueUseCase,
  ) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => [SystemSettingObjectType])
  async adminSettings(): Promise<SystemSettingObjectType[]> {
    const settings = await this.listUseCase.execute();
    return settings.map((setting) => this.toType(setting));
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Query(() => SystemSettingObjectType, { nullable: true })
  async adminSetting(@Args('name') name: string): Promise<SystemSettingObjectType | null> {
    const setting = await this.getUseCase.execute(name);
    return setting ? this.toType(setting) : null;
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => SystemSettingObjectType)
  async adminUpdateSetting(@Args('input') input: AdminUpdateSystemSettingInput): Promise<SystemSettingObjectType> {
    const updated = await this.updateUseCase.execute(input);
    return this.toType(updated);
  }

  private toType(setting: SystemSettingReadModel): SystemSettingObjectType {
    const isMasked = setting.type === PrismaSystemSettingType.PASSWORD;

    return {
      id: setting.id,
      name: setting.name,
      type: setting.type,
      value: isMasked ? null : setting.value,
      isMasked,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }
}
