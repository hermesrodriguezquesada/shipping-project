import { registerEnumType } from '@nestjs/graphql';
import { PaymentRequestMethod } from '@prisma/client';

registerEnumType(PaymentRequestMethod, { name: 'PaymentRequestMethod' });
