import { ValidationDomainException } from '../../../../core/exceptions/domain/validation.exception';

const ALLOWED_PAYMENT_PROOF_MIME_TYPES = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);
const MAX_PAYMENT_PROOF_SIZE_BYTES = 10 * 1024 * 1024;

export function parsePaymentProofImage(input: string): {
  mimeType: string;
  extension: string;
  body: Buffer;
} {
  const matches = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\r\n]+)$/i.exec(input);
  if (!matches) {
    throw new ValidationDomainException('paymentProofImg must be a valid base64 data URL');
  }

  const mimeType = matches[1].toLowerCase();
  const extension = ALLOWED_PAYMENT_PROOF_MIME_TYPES.get(mimeType);
  if (!extension) {
    throw new ValidationDomainException('Unsupported payment proof mimeType');
  }

  const base64Payload = matches[2].replace(/\s+/g, '');
  const body = Buffer.from(base64Payload, 'base64');

  if (!body.length) {
    throw new ValidationDomainException('paymentProofImg content is empty');
  }

  if (body.length > MAX_PAYMENT_PROOF_SIZE_BYTES) {
    throw new ValidationDomainException(`payment proof size must be between 1 and ${MAX_PAYMENT_PROOF_SIZE_BYTES} bytes`);
  }

  return { mimeType, extension, body };
}