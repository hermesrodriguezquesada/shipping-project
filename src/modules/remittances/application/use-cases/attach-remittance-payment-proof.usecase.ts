import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import {
  REMITTANCE_COMMAND_PORT,
  REMITTANCE_PAYMENT_PROOF_STORAGE_PORT,
  REMITTANCE_QUERY_PORT,
} from 'src/shared/constants/tokens';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import { RemittanceQueryPort } from '../../domain/ports/remittance-query.port';
import { RemittancePaymentProofStoragePort } from '../../domain/ports/remittance-payment-proof-storage.port';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class AttachRemittancePaymentProofUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
    @Inject(REMITTANCE_PAYMENT_PROOF_STORAGE_PORT)
    private readonly storage: RemittancePaymentProofStoragePort,
  ) {}

  async execute(input: {
    remittanceId: string;
    senderUserId: string;
    key: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }): Promise<boolean> {
    const remittance = await this.remittanceQuery.findByIdAndSenderUser({
      id: input.remittanceId,
      senderUserId: input.senderUserId,
    });

    if (!remittance) {
      throw new NotFoundDomainException('Remittance not found');
    }

    const expectedPrefix = `remittances/${input.remittanceId}/payment-proof/`;
    if (!input.key?.trim().startsWith(expectedPrefix)) {
      throw new ValidationDomainException('Invalid payment proof key for this remittance');
    }

    const mimeType = input.mimeType.trim().toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new ValidationDomainException('Unsupported payment proof mimeType');
    }

    if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > MAX_SIZE_BYTES) {
      throw new ValidationDomainException(`payment proof size must be between 1 and ${MAX_SIZE_BYTES} bytes`);
    }

    const fileExists = await this.storage.exists({ key: input.key.trim() });
    if (!fileExists) {
      throw new ValidationDomainException('Uploaded payment proof file was not found');
    }

    const safeFileName = input.fileName.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!safeFileName) {
      throw new ValidationDomainException('fileName is required');
    }

    await this.remittanceCommand.attachPaymentProof({
      id: input.remittanceId,
      paymentProofKey: input.key.trim(),
      paymentProofFileName: safeFileName,
      paymentProofMimeType: mimeType,
      paymentProofSizeBytes: input.sizeBytes,
      paymentProofUploadedAt: new Date(),
    });

    return true;
  }
}
