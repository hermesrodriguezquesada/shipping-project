import { Logger, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role, SystemSettingType as PrismaSystemSettingType, UserActionLogAction } from '@prisma/client';
import { Request } from 'express';
import { Roles } from 'src/core/auth/roles.decorator';
import { RolesGuard } from 'src/core/auth/roles.guard';
import { GqlAuthGuard } from 'src/modules/auth/presentation/graphql/guards/gql-auth.guard';
import { ActiveUserGuard } from 'src/core/auth/active-user.guard';
import { CurrentUser } from 'src/modules/auth/presentation/graphql/decorators/current-user.decorator';
import { AuthContextUser } from 'src/modules/auth/presentation/graphql/types/auth-context-user.type';
import { AdminGetSystemSettingUseCase } from 'src/modules/system-settings/application/use-cases/admin-get-system-setting.usecase';
import { AdminListSystemSettingsUseCase } from 'src/modules/system-settings/application/use-cases/admin-list-system-settings.usecase';
import { AdminUpdateSystemSettingValueUseCase } from 'src/modules/system-settings/application/use-cases/admin-update-system-setting-value.usecase';
import { SystemSettingReadModel } from 'src/modules/system-settings/domain/ports/system-settings-query.port';
import { AdminUpdateSystemSettingInput } from '../inputs/admin-update-system-setting.input';
import { SystemSettingObjectType } from '../types/system-setting.type';
import { RecordUserActionLogUseCase } from 'src/modules/user-action-logs/application/use-cases/record-user-action-log.usecase';
import { recordUserActionLogSafe } from 'src/modules/user-action-logs/application/utils/record-user-action-log-safe';
import { getPrimaryRole, getRequestAuditContext } from 'src/modules/user-action-logs/application/utils/user-action-log-context';

@Resolver()
export class SystemSettingsResolver {
  private readonly logger = new Logger(SystemSettingsResolver.name);

  constructor(
    private readonly listUseCase: AdminListSystemSettingsUseCase,
    private readonly getUseCase: AdminGetSystemSettingUseCase,
    private readonly updateUseCase: AdminUpdateSystemSettingValueUseCase,
    private readonly recordUserActionLog: RecordUserActionLogUseCase,
  ) {}

  @Query(() => [SystemSettingObjectType])
  async getSettings(): Promise<SystemSettingObjectType[]> {
    const settings = await this.listUseCase.execute();
    return settings.map((setting) => this.toType(setting));
  }

  @Query(() => SystemSettingObjectType, { nullable: true })
  async getSetting(@Args('name') name: string): Promise<SystemSettingObjectType | null> {
    const setting = await this.getUseCase.execute(name);
    return setting ? this.toType(setting) : null;
  }

  @UseGuards(GqlAuthGuard, RolesGuard, ActiveUserGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => SystemSettingObjectType)
  async adminUpdateSetting(
    @Args('input') input: AdminUpdateSystemSettingInput,
    @CurrentUser() authUser: AuthContextUser,
    @Context('req') req: Request,
  ): Promise<SystemSettingObjectType> {
    const updated = await this.updateUseCase.execute(input);

    await recordUserActionLogSafe(this.logger, this.recordUserActionLog, {
      actorUserId: authUser.id,
      actorEmail: authUser.email,
      actorRole: getPrimaryRole(authUser.roles),
      action: UserActionLogAction.ADMIN_UPDATE_SYSTEM_SETTING,
      resourceType: 'SYSTEM_SETTING',
      resourceId: input.name,
      description: 'Administrador actualizó configuración del sistema',
      metadata: { name: input.name },
      ...getRequestAuditContext(req),
    });

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
