import { registerEnumType } from '@nestjs/graphql';
import { BeneficiaryRelationship } from '@prisma/client';

registerEnumType(BeneficiaryRelationship, { name: 'BeneficiaryRelationship' });
