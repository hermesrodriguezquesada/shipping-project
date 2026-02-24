import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { StringValue } from 'ms';

import { LoginUseCase } from './application/use-cases/login.usecase';
import { RegisterUseCase } from './application/use-cases/register.usecase';
import { GetMeUseCase } from './application/use-cases/get-me.usecase';

import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { AuthResolver } from './presentation/graphql/resolvers/auth.resolver';

import { UsersModule } from '../users/users.module';
import { JwtTokenServiceAdapter } from './infrastructure/adapters/jwt-token-service.adapter';
import { PASSWORD_RESET_STORE, SESSION_STORE, TOKEN_SERVICE } from 'src/shared/constants/tokens';

import { AppConfigModule } from 'src/core/config/config.module';
import { AppConfigService } from 'src/core/config/config.service';
import { PrismaSessionStoreAdapter } from './infrastructure/adapters/prisma-session-store.adapter';
import { RefreshUseCase } from './application/use-cases/refresh.usecase';
import { LogoutUseCase } from './application/use-cases/logout.usecase';
import { NotificationsModule } from 'src/core/notifications/notifications.module';
import { PrismaPasswordResetStoreAdapter } from './infrastructure/adapters/prisma-password-reset-store.adapter';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.usecase';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.usecase';
import { SessionResolver } from './presentation/graphql/resolvers/session.resolver';
import { ListMySessionsUseCase } from './application/use-cases/list-my-sessions.usecase';
import { RevokeMySessionUseCase } from './application/use-cases/revoke-my-session.usecase';
import { RevokeOtherMySessionsUseCase } from './application/use-cases/revoke-other-my-sessions.usecase';
import { ChangePasswordUseCase } from './application/use-cases/change-password.usecase';

@Module({
  imports: [
    AppConfigModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtSecret,
        signOptions: {
          expiresIn: config.jwtExpiresIn as StringValue,
        },
      }),
    }),
    NotificationsModule,
  ],
  providers: [
    AuthResolver,
    SessionResolver,
    LoginUseCase,
    RegisterUseCase,
    GetMeUseCase,
    RefreshUseCase,
    LogoutUseCase,
    ListMySessionsUseCase,
    RevokeMySessionUseCase,
    RevokeOtherMySessionsUseCase,
    ChangePasswordUseCase,
    JwtStrategy,
    { provide: SESSION_STORE, useClass: PrismaSessionStoreAdapter },
    { provide: TOKEN_SERVICE, useClass: JwtTokenServiceAdapter },
    { provide: PASSWORD_RESET_STORE, useClass: PrismaPasswordResetStoreAdapter },
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
  ],
})
export class AuthModule {}
