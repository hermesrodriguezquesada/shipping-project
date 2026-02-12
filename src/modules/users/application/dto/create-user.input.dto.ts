import { Role } from '@prisma/client';

export class CreateUserInputDto {
  email: string;
  password: string;
  roles?: Role[];
}
