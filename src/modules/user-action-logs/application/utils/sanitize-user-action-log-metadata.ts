const SENSITIVE_KEY_PATTERN = /password|access.?token|refresh.?token|paymentproof(img|image|key)|base64|s3.?key|document|attachment|image|file|destinationaccountnumber|originaccount|accountnumber|bankaccount|iban|clabe|routingnumber|cardnumber/i;
const DATA_URL_PATTERN = /^data:[^;]+;base64,/i;
const BASE64_BLOB_PATTERN = /^[A-Za-z0-9+/=\r\n]{128,}$/;

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    const sanitizedItems = value
      .map((item) => sanitizeValue(item))
      .filter((item) => item !== undefined);

    return sanitizedItems.length ? sanitizedItems : null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    const sanitizedEntries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SENSITIVE_KEY_PATTERN.test(key))
      .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)] as const)
      .filter(([, nestedValue]) => nestedValue !== undefined);

    if (!sanitizedEntries.length) {
      return null;
    }

    return Object.fromEntries(sanitizedEntries);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (DATA_URL_PATTERN.test(trimmed) || BASE64_BLOB_PATTERN.test(trimmed)) {
      return '[REDACTED]';
    }

    return trimmed;
  }

  return value;
}

export function sanitizeUserActionLogMetadata(metadata: unknown): string | null {
  const sanitized = sanitizeValue(metadata);

  if (
    sanitized === null ||
    sanitized === undefined ||
    (Array.isArray(sanitized) && sanitized.length === 0) ||
    (typeof sanitized === 'object' && !Array.isArray(sanitized) && Object.keys(sanitized as Record<string, unknown>).length === 0)
  ) {
    return null;
  }

  return JSON.stringify(sanitized);
}