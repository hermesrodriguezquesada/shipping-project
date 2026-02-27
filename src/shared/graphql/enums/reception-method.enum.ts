import { registerEnumType } from '@nestjs/graphql';
import { ReceptionMethod } from '@prisma/client';

registerEnumType(ReceptionMethod, { name: 'ReceptionMethod' });
