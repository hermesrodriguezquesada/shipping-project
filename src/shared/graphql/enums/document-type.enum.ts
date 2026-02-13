import { registerEnumType } from '@nestjs/graphql';
import { DocumentType } from '@prisma/client';

registerEnumType(DocumentType, { name: 'DocumentType' });
