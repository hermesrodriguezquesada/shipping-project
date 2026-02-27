import './shared/graphql/enums/index';

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
import { BeneficiariesModule } from './modules/beneficiaries/beneficiaries.module';
import { RemittancesModule } from './modules/remittances/remittances.module';
import { CatalogsModule } from './modules/catalogs/catalogs.module';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AppGraphqlModule,
    CryptoModule,
    UsersModule,
    AuthModule,
    IdentityModule,
    BeneficiariesModule,
    CatalogsModule,
    ExchangeRatesModule,
    RemittancesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
