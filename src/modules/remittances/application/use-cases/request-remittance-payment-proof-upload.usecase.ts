import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import {
  REMITTANCE_PAYMENT_PROOF_STORAGE_PORT,
  REMITTANCE_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';
import { RemittancePaymentProofStoragePort } from '../../domain/ports/remittance-payment-proof-storage.port';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const UPLOAD_URL_TTL_SECONDS = 15 * 60;

@Injectable()
export class RequestRemittancePaymentProofUploadUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_PAYMENT_PROOF_STORAGE_PORT)
    private readonly storage: RemittancePaymentProofStoragePort,
  ) {}

  async execute(input: {
    remittanceId: string;
    senderUserId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }): Promise<{ uploadUrl: string; key: string; method: string; expiresAt: Date }> {
    const remittance = await this.remittanceQuery.findByIdAndSenderUser({
      id: input.remittanceId,
      senderUserId: input.senderUserId,
    });

    if (!remittance) {
      throw new NotFoundDomainException('Remittance not found');
    }

    const mimeType = input.mimeType.trim().toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new ValidationDomainException('Unsupported payment proof mimeType');
    }

    if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > MAX_SIZE_BYTES) {
      throw new ValidationDomainException(`payment proof size must be between 1 and ${MAX_SIZE_BYTES} bytes`);
    }

    const safeFileName = input.fileName.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!safeFileName) {
      throw new ValidationDomainException('fileName is required');
    }

    const extension = this.extractExtension(safeFileName);
    const key = `remittances/${input.remittanceId}/payment-proof/${randomUUID()}${extension}`;
    const uploadUrl = await this.storage.createPresignedUploadUrl({
      key,
      mimeType,
      expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
    });

    return {
      uploadUrl,
      key,
      method: 'PUT',
      expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
    };
  }

  private extractExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
      return '';
    }

    const extension = fileName.slice(dotIndex).toLowerCase();
    return /^[.][a-z0-9]{1,10}$/.test(extension) ? extension : '';
  }
}
