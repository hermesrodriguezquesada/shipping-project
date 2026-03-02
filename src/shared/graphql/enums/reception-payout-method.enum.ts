import { registerEnumType } from '@nestjs/graphql';
import { ReceptionPayoutMethod } from '@prisma/client';

registerEnumType(ReceptionPayoutMethod, { name: 'ReceptionPayoutMethod' });
