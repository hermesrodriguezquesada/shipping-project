import { registerEnumType } from '@nestjs/graphql';
import { PaymentRequestStatus } from '@prisma/client';

registerEnumType(PaymentRequestStatus, { name: 'PaymentRequestStatus' });
