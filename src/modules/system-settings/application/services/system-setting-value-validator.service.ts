import { Injectable } from '@nestjs/common';
import { SystemSettingType } from '@prisma/client';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';

@Injectable()
export class SystemSettingValueValidatorService {
  normalizeByType(type: SystemSettingType, value: string | null): string | null {
    const isEmpty = value === null || value === undefined || value.trim().length === 0;

    if (isEmpty) {
      if (type === SystemSettingType.BOOLEAN) {
        throw new ValidationDomainException('value is required for BOOLEAN type');
      }
      return null;
    }

    const normalized = value!.trim();

    switch (type) {
      case SystemSettingType.STRING:
        return value;
      case SystemSettingType.EMAIL:
        if (!this.isEmail(normalized)) {
          throw new ValidationDomainException('value must be a valid email');
        }
        return normalized.toLowerCase();
      case SystemSettingType.URL:
        this.assertValidUrl(normalized);
        return normalized;
      case SystemSettingType.NUMBER:
        return this.normalizeNumber(normalized);
      case SystemSettingType.BOOLEAN:
        return this.normalizeBoolean(normalized);
      case SystemSettingType.PASSWORD:
        return value;
      default:
        throw new ValidationDomainException('unsupported setting type');
    }
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private assertValidUrl(value: string): void {
    let parsed: URL;

    try {
      parsed = new URL(value);
    } catch {
      throw new ValidationDomainException('value must be a valid URL');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new ValidationDomainException('value must be an http or https URL');
    }
  }

  private normalizeNumber(value: string): string {
    const asNumber = Number(value);
    if (!Number.isFinite(asNumber)) {
      throw new ValidationDomainException('value must be a valid number');
    }

    return asNumber.toString();
  }

  private normalizeBoolean(value: string): string {
    const lower = value.toLowerCase();

    if (lower === 'true' || lower === 'false') {
      return lower;
    }

    throw new ValidationDomainException('value must be true or false');
  }
}
