import { Inject, Injectable } from '@nestjs/common';
import { USER_AUTH_PORT, PASSWORD_HASHER, TOKEN_SERVICE, SESSION_STORE } from 'src/shared/constants/tokens';
import { UnauthorizedDomainException } from 'src/core/exceptions/domain/unauthorized.exception';

import { LoginInputDto } from '../dto/login.input.dto';
import { Credentials } from '../../domain/value-objects/credentials.vo';

import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { TokenServicePort } from '../../domain/ports/token-service.port';
import { UserAuthPort } from 'src/modules/users/domain/ports/user-auth.port';
import { SessionStorePort } from '../../domain/ports/session-store.port';
import { AppConfigService } from 'src/core/config/config.service';
import { Role } from '@prisma/client';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_AUTH_PORT) 
    private readonly userAuth: UserAuthPort,
    @Inject(PASSWORD_HASHER) 
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) 
    private readonly tokenService: TokenServicePort,
    @Inject(SESSION_STORE) 
    private readonly sessions: SessionStorePort,
    private readonly config: AppConfigService,
  ) {}

  async execute(input: LoginInputDto): Promise<{
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    user: { id: string; email: string; roles: Role[] };
  }> {
    const creds = Credentials.create(input.email, input.password);
    const email = creds.email.trim().toLowerCase();

    const authUser = await this.userAuth.findAuthByEmail(email);
    if (!authUser) throw new UnauthorizedDomainException('Invalid credentials');

    if (!authUser.isActive || authUser.isDeleted) {
      throw new UnauthorizedDomainException('User is disabled');
    }

    const isValid = await this.passwordHasher.compare(creds.password, authUser.passwordHash);
    if (!isValid) throw new UnauthorizedDomainException('Invalid credentials');

    const expiresAt = this.computeRefreshExpiresAt(this.config.jwtRefreshExpiresIn);
    const session = await this.sessions.create({
      userId: authUser.id,
      refreshTokenHash: 'temp',
      expiresAt,
    });

    const accessToken = await this.tokenService.signAccess({
      sub: authUser.id,
      email: authUser.email,
      roles: authUser.roles,
    });

    const refreshToken = await this.tokenService.signRefresh({
      sub: authUser.id,
      sid: session.id,
    });

    // 3) Guardar hash del refresh token
    const refreshTokenHash = await this.passwordHasher.hash(refreshToken);
    await this.sessions.setRefreshHash(session.id, refreshTokenHash);

    return {
      accessToken,
      refreshToken,
      sessionId: session.id,
      user: { id: authUser.id, email: authUser.email, roles: authUser.roles },
    };
  }

  private computeRefreshExpiresAt(expiresIn: string): Date {
    // acepta formatos simples: "30d", "7d", "3600s"
    const match = /^(\d+)([smhd])$/.exec(expiresIn.trim());
    if (!match) {
      // fallback: 30d
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    const value = Number(match[1]);
    const unit = match[2];

    const ms =
      unit === 's' ? value * 1000 :
      unit === 'm' ? value * 60 * 1000 :
      unit === 'h' ? value * 60 * 60 * 1000 :
      value * 24 * 60 * 60 * 1000;

    return new Date(Date.now() + ms);
  }
}
