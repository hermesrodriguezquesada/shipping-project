import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain/domain.exception';
import { SYSTEM_SETTINGS_QUERY_PORT } from '../../../../shared/constants/tokens';
import { SystemSettingsQueryPort } from '../../../system-settings/domain/ports/system-settings-query.port';

@Injectable()
export class SystemCashPickupAddressUseCase {
  constructor(
    @Inject(SYSTEM_SETTINGS_QUERY_PORT)
    private readonly systemSettingsQuery: SystemSettingsQueryPort,
  ) {}

  async execute(): Promise<string> {
    const setting = await this.systemSettingsQuery.findByName('CASH_PICKUP_ADDRESS');
    if (!setting || !setting.value) {
      throw new DomainException('Pickup address not configured');
    }
    return setting.value;
  }
}
