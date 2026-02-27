import { registerEnumType } from '@nestjs/graphql';
import { TransferStatus } from '@prisma/client';

registerEnumType(TransferStatus, { name: 'TransferStatus' });
