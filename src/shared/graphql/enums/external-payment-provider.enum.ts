import { registerEnumType } from '@nestjs/graphql';
import { ExternalPaymentProvider } from '@prisma/client';

registerEnumType(ExternalPaymentProvider, { name: 'ExternalPaymentProvider' });
