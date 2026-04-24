import { registerEnumType } from '@nestjs/graphql';
import { VipPaymentProofStatus } from '@prisma/client';

registerEnumType(VipPaymentProofStatus, { name: 'VipPaymentProofStatus' });