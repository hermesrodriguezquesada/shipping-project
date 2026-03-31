import { registerEnumType } from '@nestjs/graphql';
import { ExternalPaymentStatus } from '@prisma/client';

registerEnumType(ExternalPaymentStatus, { name: 'ExternalPaymentStatus' });
