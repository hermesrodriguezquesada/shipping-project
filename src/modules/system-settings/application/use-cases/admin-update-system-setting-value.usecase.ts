import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { SYSTEM_SETTINGS_COMMAND_PORT, SYSTEM_SETTINGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { SystemSettingValueValidatorService } from '../services/system-setting-value-validator.service';
import { SystemSettingsCommandPort } from '../../domain/ports/system-settings-command.port';
import { SystemSettingReadModel, SystemSettingsQueryPort } from '../../domain/ports/system-settings-query.port';

@Injectable()
export class AdminUpdateSystemSettingValueUseCase {
  constructor(
    @Inject(SYSTEM_SETTINGS_QUERY_PORT)
    private readonly systemSettingsQuery: SystemSettingsQueryPort,
    @Inject(SYSTEM_SETTINGS_COMMAND_PORT)
    private readonly systemSettingsCommand: SystemSettingsCommandPort,
    private readonly valueValidator: SystemSettingValueValidatorService,
  ) {}

  async execute(input: { name: string; value: string | null }): Promise<SystemSettingReadModel> {
    const name = input.name?.trim();
    if (!name) {
      throw new ValidationDomainException('name is required');
    }

    const existing = await this.systemSettingsQuery.findByName(name);
    if (!existing) {
      throw new NotFoundDomainException('System setting not found');
    }

    const normalizedValue = this.valueValidator.normalizeByType(existing.type, input.value);

    return this.systemSettingsCommand.updateValueByName({
      name,
      value: normalizedValue,
    });
  }
}
