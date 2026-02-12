import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { BeneficiaryQueryPort } from '../../domain/ports/beneficiary-query.port';
import { BeneficiaryEntity } from '../../domain/entities/beneficiary.entity';
import { Beneficiary as PrismaBeneficiary } from '@prisma/client';

@Injectable()
export class PrismaBeneficiaryQueryAdapter implements BeneficiaryQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(input: { id: string; ownerUserId: string }): Promise<BeneficiaryEntity | null> {
    const row = await this.prisma.beneficiary.findFirst({
      where: { id: input.id, ownerUserId: input.ownerUserId, isDeleted: false },
    });
    return row ? this.toEntity(row) : null;
  }

  async listByOwner(input: { ownerUserId: string; offset: number; limit: number; includeDeleted?: boolean }): Promise<BeneficiaryEntity[]> {
    const rows = await this.prisma.beneficiary.findMany({
      where: {
        ownerUserId: input.ownerUserId,
        ...(input.includeDeleted ? {} : { isDeleted: false }),
      },
      skip: input.offset,
      take: input.limit,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(this.toEntity);
  }

  private toEntity(row: PrismaBeneficiary): BeneficiaryEntity {
    return { ...row };
  }
}
