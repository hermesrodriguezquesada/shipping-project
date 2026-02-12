import { registerEnumType } from '@nestjs/graphql';
import { IdentityStatus, DocumentType } from '@prisma/client';

registerEnumType(IdentityStatus, { name: 'IdentityStatus' });
registerEnumType(DocumentType, { name: 'DocumentType' });
