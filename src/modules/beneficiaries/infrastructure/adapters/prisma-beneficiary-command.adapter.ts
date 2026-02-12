import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { BeneficiaryCommandPort, CreateBeneficiaryData, UpdateBeneficiaryData } from '../../domain/ports/beneficiary-command.port';
import { BeneficiaryEntity } from '../../domain/entities/beneficiary.entity';
import { Beneficiary as PrismaBeneficiary } from '@prisma/client';

import { DomainException } from 'src/core/exceptions/domain/domain.exception';
import { DomainErrorCode } from 'src/core/exceptions/domain/error-codes';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';

@Injectable()
export class PrismaBeneficiaryCommandAdapter implements BeneficiaryCommandPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBeneficiaryData): Promise<BeneficiaryEntity> {
    const row = await this.prisma.beneficiary.create({
      data: {
        ...data,
        email: data.email ? data.email.trim().toLowerCase() : undefined,
        fullName: data.fullName.trim(),
      },
    });

    return this.toEntity(row);
  }

  async update(data: UpdateBeneficiaryData): Promise<BeneficiaryEntity> {
    const { id, ownerUserId, ...patch } = data;
    const existing = await this.prisma.beneficiary.findUnique({
      where: { id },
      select: { ownerUserId: true, isDeleted: true },
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundDomainException(`Beneficiary with id ${id} not found`);
    }

    if (existing.ownerUserId !== ownerUserId) {
      throw new DomainException('Forbidden', DomainErrorCode.FORBIDDEN);
    }

    const row = await this.prisma.beneficiary.update({
      where: { id },
      data: {
        ...patch,
        email:
          patch.email === undefined
            ? undefined
            : patch.email
              ? patch.email.trim().toLowerCase()
              : null,
        fullName: patch.fullName === undefined ? undefined : patch.fullName.trim(),
      },
    });

    return this.toEntity(row);
  }

  async softDelete(input: { id: string; ownerUserId: string }): Promise<void> {
    const { id, ownerUserId } = input;
    const existing = await this.prisma.beneficiary.findUnique({
      where: { id },
      select: { ownerUserId: true, isDeleted: true },
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundDomainException(`Beneficiary with id ${id} not found`);
    }

    if (existing.ownerUserId !== ownerUserId) {
      throw new DomainException('Forbidden', DomainErrorCode.FORBIDDEN);
    }

    await this.prisma.beneficiary.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  private toEntity(row: PrismaBeneficiary): BeneficiaryEntity {
    return { ...row };
  }
}
