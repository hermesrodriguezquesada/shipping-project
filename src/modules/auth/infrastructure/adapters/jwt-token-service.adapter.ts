import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from 'src/core/config/config.service';
import { TokenServicePort } from '../../domain/ports/token-service.port';
import type { StringValue } from 'ms';

@Injectable()
export class JwtTokenServiceAdapter implements TokenServicePort {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  signAccess(payload: Record<string, any>): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.jwtSecret,
      expiresIn: this.config.jwtAccessExpiresIn as StringValue,
    });
  }

  signRefresh(payload: Record<string, any>): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: this.config.jwtRefreshExpiresIn as StringValue,
    });
  }

  verifyAccess<T extends object = any>(token: string): Promise<T> {
    return this.jwt.verifyAsync<T>(token, { secret: this.config.jwtSecret });
  }

  verifyRefresh<T extends object = any>(token: string): Promise<T> {
    return this.jwt.verifyAsync<T>(token, { secret: this.config.jwtRefreshSecret });
  }
}
