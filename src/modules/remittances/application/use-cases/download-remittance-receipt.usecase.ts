import { Inject, Injectable } from '@nestjs/common';
import { Role, RemittanceStatus } from '@prisma/client';
import {
  REMITTANCE_QUERY_PORT,
  REMITTANCE_RECEIPT_PDF_GENERATOR_PORT,
} from 'src/shared/constants/tokens';
import { UserEntity } from 'src/modules/users/domain/entities/user.entity';
import { RemittanceQueryPort, RemittanceReadModel } from '../../domain/ports/remittance-query.port';
import {
  RemittanceReceiptPdfData,
  RemittanceReceiptPdfGeneratorPort,
} from '../../domain/ports/remittance-receipt-pdf-generator.port';

export class RemittanceReceiptNotFoundError extends Error {
  constructor(message = 'Remittance not found') {
    super(message);
    this.name = 'RemittanceReceiptNotFoundError';
  }
}

export class RemittanceReceiptForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'RemittanceReceiptForbiddenError';
  }
}

@Injectable()
export class DownloadRemittanceReceiptUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_RECEIPT_PDF_GENERATOR_PORT)
    private readonly pdfGenerator: RemittanceReceiptPdfGeneratorPort,
  ) {}

  async execute(input: {
    remittanceId: string;
    requesterUserId: string;
    requesterRoles: Role[];
  }): Promise<{ filename: string; pdfBuffer: Buffer }> {
    const remittance = await this.remittanceQuery.findRemittanceById({
      id: input.remittanceId,
    });

    if (!remittance) {
      throw new RemittanceReceiptNotFoundError();
    }

    const isAdmin = input.requesterRoles.includes(Role.ADMIN);
    const isOwner = remittance.sender.id === input.requesterUserId;

    if (!isAdmin && !isOwner) {
      throw new RemittanceReceiptForbiddenError();
    }

    const pdfBuffer = await this.pdfGenerator.generate(this.toPdfData(remittance));

    return {
      filename: `remittance-${remittance.id}.pdf`,
      pdfBuffer,
    };
  }

  private toPdfData(remittance: RemittanceReadModel): RemittanceReceiptPdfData {
    return {
      remittanceId: remittance.id,
      statusLabel: this.toStatusLabel(remittance.status),
      createdAt: remittance.createdAt,
      updatedAt: remittance.updatedAt,
      exchangeRateUsedAt: remittance.exchangeRateUsedAt,
      ownerName: this.resolveOwnerName(remittance.sender),
      ownerEmail: remittance.sender.email,
      recipient: {
        fullName: remittance.recipientFullName,
        phone: remittance.recipientPhone,
        country: remittance.recipientCountry,
        addressLine1: remittance.recipientAddressLine1,
        documentNumber: remittance.recipientDocumentNumber,
        email: remittance.recipientEmail,
        city: remittance.recipientCity,
        addressLine2: remittance.recipientAddressLine2,
        postalCode: remittance.recipientPostalCode,
      },
      sentAmount: remittance.amount.toString(),
      receivedAmount: remittance.netReceivingAmount?.toString() ?? null,
      paymentCurrencyCode: remittance.paymentCurrency?.code ?? null,
      receivingCurrencyCode: remittance.receivingCurrency?.code ?? null,
      paymentMethodLabel: this.resolveMethodLabel(remittance.paymentMethod?.name, remittance.paymentMethod?.code),
      receptionMethodLabel: this.resolveMethodLabel(
        remittance.receptionMethodCatalog?.name,
        remittance.receptionMethodCatalog?.code,
      ),
      appliedExchangeRate: remittance.exchangeRateRateUsed?.toString() ?? null,
      paymentDetails: remittance.paymentDetails,
      statusDescription: remittance.statusDescription,
    };
  }

  private resolveOwnerName(sender: UserEntity): string {
    const fullName = [sender.firstName?.trim(), sender.lastName?.trim()].filter(Boolean).join(' ').trim();

    if (fullName) {
      return fullName;
    }

    const companyName = sender.companyName?.trim();
    if (companyName) {
      return companyName;
    }

    return sender.email;
  }

  private resolveMethodLabel(name?: string | null, code?: string | null): string | null {
    const cleanName = name?.trim();
    const cleanCode = code?.trim();

    if (cleanName && cleanCode) {
      return `${cleanName} (${cleanCode})`;
    }

    return cleanName ?? cleanCode ?? null;
  }

  private toStatusLabel(status: RemittanceStatus): string {
    const labels: Record<RemittanceStatus, string> = {
      PENDING_PAYMENT: 'Pendiente de pago',
      PENDING_PAYMENT_CONFIRMATION: 'Pago reportado pendiente de confirmacion',
      PAID_SENDING_TO_RECEIVER: 'Pagado enviando al destinatario',
      SUCCESS: 'Entregada',
      PAYMENT_ERROR: 'Error de pago',
      CANCELED_BY_CLIENT: 'Cancelada por cliente',
      CANCELED_BY_ADMIN: 'Cancelada por administrador',
      SUBMITTED: 'Enviada',
      CANCELLED: 'Cancelada',
      COMPLETED: 'Completada',
    };

    return labels[status] ?? 'Estado desconocido';
  }
}
