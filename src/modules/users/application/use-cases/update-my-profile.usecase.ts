import { Inject, Injectable } from '@nestjs/common';
import { USER_COMMAND_PORT, USER_QUERY_PORT } from 'src/shared/constants/tokens';
import { UserCommandPort } from '../../domain/ports/user-command.port';
import { UserQueryPort } from '../../domain/ports/user-query.port';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { UnauthorizedDomainException } from 'src/core/exceptions/domain/unauthorized.exception';
import { UpdateMyProfileDto } from '../dto/update-my-profile.dto';
import { UserEntity } from '../../domain/entities/user.entity';

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(
    @Inject(USER_COMMAND_PORT) 
    private readonly commands: UserCommandPort,
    @Inject(USER_QUERY_PORT) 
    private readonly query: UserQueryPort,
  ) {}

  async execute(userId: string, input: UpdateMyProfileDto): Promise<UserEntity> {
    const user = await this.query.findById(userId);
    if (!user) throw new NotFoundDomainException('User not found');
    if (!user.isActive || user.isDeleted) throw new UnauthorizedDomainException('User is disabled');

    return this.commands.updateProfile({ id: userId, ...input });
  }
}
