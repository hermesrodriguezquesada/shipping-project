import { Injectable } from '@nestjs/common';
import {
  RemittanceReceiptPdfData,
  RemittanceReceiptPdfGeneratorPort,
} from '../../domain/ports/remittance-receipt-pdf-generator.port';

@Injectable()
export class SimplePdfReceiptGeneratorAdapter implements RemittanceReceiptPdfGeneratorPort {
  private static readonly PDF_ENCODING: BufferEncoding = 'latin1';

  async generate(input: RemittanceReceiptPdfData): Promise<Buffer> {
    const lines = this.buildLines(input);
    return this.buildPdf(lines);
  }

  private buildLines(input: RemittanceReceiptPdfData): string[] {
    const lines: string[] = [
      'SHIPPING PROJECT',
      'Comprobante de remesa',
      '',
      `ID de remesa: ${input.remittanceId}`,
      `Estado: ${input.statusLabel}`,
      `Fecha de creacion: ${this.formatDate(input.createdAt)}`,
      `Fecha de actualizacion: ${this.formatDate(input.updatedAt)}`,
      `Fecha tasa aplicada: ${this.formatDate(input.exchangeRateUsedAt)}`,
      '',
      'Remitente',
      `Nombre: ${input.ownerName}`,
      `Email: ${input.ownerEmail}`,
      '',
      'Destinatario (snapshot)',
      `Nombre: ${input.recipient.fullName}`,
      `Telefono: ${input.recipient.phone}`,
      `Pais: ${input.recipient.country}`,
      `Direccion: ${input.recipient.addressLine1}`,
      `Documento: ${input.recipient.documentNumber}`,
      `Email: ${this.valueOrND(input.recipient.email)}`,
      `Ciudad: ${this.valueOrND(input.recipient.city)}`,
      '',
      'Montos y metodos',
      `Monto enviado: ${input.sentAmount}`,
      `Monto recibido: ${this.valueOrND(input.receivedAmount)}`,
      `Moneda de pago: ${this.valueOrND(input.paymentCurrencyCode)}`,
      `Moneda de recepcion: ${this.valueOrND(input.receivingCurrencyCode)}`,
      `Metodo de pago: ${this.valueOrND(input.paymentMethodLabel)}`,
      `Metodo de recepcion: ${this.valueOrND(input.receptionMethodLabel)}`,
      `Tasa aplicada: ${this.valueOrND(input.appliedExchangeRate)}`,
      '',
      'Notas',
    ];

    if (input.paymentDetails?.trim()) {
      lines.push(`paymentDetails: ${input.paymentDetails.trim()}`);
    }

    if (input.statusDescription?.trim()) {
      lines.push(`statusDescription: ${input.statusDescription.trim()}`);
    }

    if (!input.paymentDetails?.trim() && !input.statusDescription?.trim()) {
      lines.push('Sin notas adicionales');
    }

    lines.push('');
    lines.push('Este es un comprobante informativo, no tiene validez fiscal.');

    return lines;
  }

  private buildPdf(lines: string[]): Buffer {
    const streamContent = this.buildTextStream(lines);

    const objects = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
      `4 0 obj\n<< /Length ${Buffer.byteLength(streamContent, SimplePdfReceiptGeneratorAdapter.PDF_ENCODING)} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
      '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n',
    ];

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];

    for (const objectContent of objects) {
      offsets.push(Buffer.byteLength(pdf, SimplePdfReceiptGeneratorAdapter.PDF_ENCODING));
      pdf += objectContent;
    }

    const xrefOffset = Buffer.byteLength(pdf, SimplePdfReceiptGeneratorAdapter.PDF_ENCODING);

    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';

    for (const offset of offsets) {
      pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(pdf, SimplePdfReceiptGeneratorAdapter.PDF_ENCODING);
  }

  private buildTextStream(lines: string[]): string {
    const streamLines: string[] = ['BT', '/F1 11 Tf', '50 800 Td', '14 TL'];

    lines.forEach((line, index) => {
      if (index > 0) {
        streamLines.push('T*');
      }
      streamLines.push(`(${this.escapePdfText(line)}) Tj`);
    });

    streamLines.push('ET');

    return streamLines.join('\n');
  }

  private escapePdfText(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  private formatDate(value: Date | null): string {
    if (!value) {
      return 'N/D';
    }

    return value.toISOString();
  }

  private valueOrND(value: string | null): string {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : 'N/D';
  }
}
