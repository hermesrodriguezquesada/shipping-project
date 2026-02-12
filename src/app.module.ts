import './shared/graphql/enums/role.enum';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AppConfigModule } from './core/config/config.module';
import { PrismaModule } from './core/database/prisma.module';
import { AppGraphqlModule } from './core/graphql/graphql.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CryptoModule } from './core/crypto/crypto.module';
import { IdentityModule } from './modules/identity/identity.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AppGraphqlModule,
    CryptoModule,
    UsersModule,
    AuthModule,
    IdentityModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
