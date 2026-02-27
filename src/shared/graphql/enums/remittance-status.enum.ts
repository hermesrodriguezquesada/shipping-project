import { registerEnumType } from '@nestjs/graphql';
import { RemittanceStatus } from '@prisma/client';

registerEnumType(RemittanceStatus, { name: 'RemittanceStatus' });
