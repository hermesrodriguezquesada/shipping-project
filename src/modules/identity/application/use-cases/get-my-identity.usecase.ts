import { Inject, Injectable } from '@nestjs/common';
import { IdentityQueryPort } from '../../domain/ports/identity-query.port';
import { IDENTITY_QUERY_PORT } from 'src/shared/constants/tokens';

@Injectable()
export class GetMyIdentityUseCase {
  constructor(
    @Inject(IDENTITY_QUERY_PORT) 
    private readonly identity: IdentityQueryPort
  ) {}

  execute(userId: string) {
    return this.identity.getByUserId(userId);
  }
}
