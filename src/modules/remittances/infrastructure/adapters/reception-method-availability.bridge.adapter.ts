import { Inject, Injectable } from '@nestjs/common';
import { CatalogsQueryPort } from 'src/modules/catalogs/domain/ports/catalogs-query.port';
import { CATALOGS_QUERY_PORT } from 'src/shared/constants/tokens';
import { ReceptionMethodAvailabilityPort } from '../../domain/ports/reception-method-availability.port';

@Injectable()
export class ReceptionMethodAvailabilityBridgeAdapter implements ReceptionMethodAvailabilityPort {
  constructor(
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
  ) {}

  async findEnabledReceptionMethodByCode(input: { code: string }) {
    const receptionMethod = await this.catalogsQuery.findReceptionMethodByCode({ code: input.code });
    if (!receptionMethod || !receptionMethod.enabled) {
      return null;
    }

    return { id: receptionMethod.id, code: receptionMethod.code, enabled: receptionMethod.enabled };
  }
}
