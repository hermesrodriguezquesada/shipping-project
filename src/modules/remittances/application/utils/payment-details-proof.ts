const IMG_PAYMENT_PROOF_FIELD = 'img_payment_proof';
const ACCOUNT_HOLDER_NAME_FIELD = 'account_holder_name';

type PaymentDetailItem = { name?: unknown; value?: unknown };

export function buildPaymentDetailsProofJson(input: {
  paymentProofKey: string;
  accountHolderName: string;
}): string {
  return JSON.stringify([
    { name: IMG_PAYMENT_PROOF_FIELD, value: input.paymentProofKey },
    { name: ACCOUNT_HOLDER_NAME_FIELD, value: input.accountHolderName },
  ]);
}

export function extractPaymentProofKeyFromDetails(paymentDetails: string | null | undefined): string | null {
  if (!paymentDetails?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(paymentDetails) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }

    const proofItem = (parsed as PaymentDetailItem[]).find(
      (item) => item?.name === IMG_PAYMENT_PROOF_FIELD,
    );

    if (!proofItem || typeof proofItem.value !== 'string') {
      return null;
    }

    const key = proofItem.value.trim();
    return key.length > 0 ? key : null;
  } catch {
    return null;
  }
}