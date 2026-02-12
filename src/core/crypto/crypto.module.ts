import { Global, Module } from '@nestjs/common';
import { PASSWORD_HASHER } from 'src/shared/constants/tokens';
import { BcryptPasswordHasherAdapter } from 'src/modules/auth/infrastructure/adapters/bcrypt-password-hasher.adapter';

@Global()
@Module({
  providers: [
    { provide: PASSWORD_HASHER, 
      useClass: BcryptPasswordHasherAdapter 
    }],
  exports: [PASSWORD_HASHER],
})
export class CryptoModule {}
