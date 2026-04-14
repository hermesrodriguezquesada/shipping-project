import { Role, RemittanceStatus } from '@prisma/client';
import { GetRemittancePaymentProofViewUrlUseCase } from 'src/modules/remittances/application/use-cases/get-remittance-payment-proof-view-url.usecase';
import { RemittanceLifecycleUseCase } from 'src/modules/remittances/application/use-cases/remittance-lifecycle.usecase';
import { extractPaymentProofKeyFromDetails } from 'src/modules/remittances/application/utils/payment-details-proof';

const state = {
  remittance: {
    id: 'rem-001',
    status: RemittanceStatus.PENDING_PAYMENT as RemittanceStatus,
    paymentDetails: null as string | null,
    senderId: 'user-001',
    senderEmail: 'owner@example.com',
  },
  uploadedKeys: new Set<string>(),
};

const remittanceQuery = {
  async findByIdAndSenderUser(input: { id: string; senderUserId: string }) {
    if (state.remittance.id !== input.id || state.remittance.senderId !== input.senderUserId) {
      return null;
    }

    return {
      id: state.remittance.id,
      status: state.remittance.status,
      senderEmail: state.remittance.senderEmail,
    };
  },

  async findRemittanceById(input: { id: string }) {
    if (state.remittance.id !== input.id) {
      return null;
    }

    return {
      id: state.remittance.id,
      status: state.remittance.status,
      paymentDetails: state.remittance.paymentDetails,
      paymentProofKey: null,
      sender: {
        id: state.remittance.senderId,
        email: state.remittance.senderEmail,
      },
    };
  },
};

const remittanceCommand = {
  async markPaid(input: { id: string; paymentDetails: string }) {
    if (state.remittance.id !== input.id) {
      throw new Error('unexpected remittance id');
    }

    state.remittance.paymentDetails = input.paymentDetails;
    state.remittance.status = RemittanceStatus.PENDING_PAYMENT_CONFIRMATION;
  },
};

const paymentProofStorage = {
  async createPresignedUploadUrl() {
    return 'unused';
  },
  async createPresignedViewUrl(input: { key: string; expiresInSeconds: number }) {
    return `https://proof.local/${encodeURIComponent(input.key)}?exp=${input.expiresInSeconds}`;
  },
  async uploadObject(input: { key: string; mimeType: string; body: Buffer }) {
    if (!input.body.length || !input.mimeType.startsWith('image/')) {
      throw new Error('invalid upload object');
    }

    state.uploadedKeys.add(input.key);
  },
  async exists(input: { key: string }) {
    return state.uploadedKeys.has(input.key);
  },
};

const notifier = {
  async notifyStatusChange() {
    return;
  },
};

async function main() {
  const lifecycle = new RemittanceLifecycleUseCase(
    remittanceQuery as any,
    remittanceCommand as any,
    paymentProofStorage as any,
    notifier as any,
  );

  const viewUseCase = new GetRemittancePaymentProofViewUrlUseCase(
    remittanceQuery as any,
    paymentProofStorage as any,
  );

  const paymentProofImg =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+Fj8AAAAASUVORK5CYII=';

  const markPaid = await lifecycle.markPaid({
    remittanceId: state.remittance.id,
    senderUserId: state.remittance.senderId,
    paymentProofImg,
    accountHolderName: 'Cuenta QA',
  });

  const proofKey = extractPaymentProofKeyFromDetails(state.remittance.paymentDetails);

  const view = await viewUseCase.execute({
    remittanceId: state.remittance.id,
    requesterUserId: state.remittance.senderId,
    requesterRoles: [Role.CLIENT],
  });

  const summary = {
    markRemittancePaidResult: markPaid,
    statusAfter: state.remittance.status,
    paymentDetails: state.remittance.paymentDetails,
    extractedProofKey: proofKey,
    uploadedKeyCount: state.uploadedKeys.size,
    viewUrl: view.viewUrl,
    expiresAt: view.expiresAt.toISOString(),
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
